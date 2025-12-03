import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Mention = {
    type: 'user';
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    verification_status?: string | null;
};

type Hashtag = {
    type: 'hashtag';
    id: number;
    name: string;
    slug: string;
    usage_count?: number;
    recent_usage_count?: number;
};

type Suggestion = Mention | Hashtag;

type MentionHashtagAutocompleteProps = {
    value: string;
    selectionStart: number;
    selectionEnd: number;
    onInsert: (text: string, replaceStart: number, replaceEnd: number) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    overlayRef: React.RefObject<HTMLDivElement>;
    disabled?: boolean;
};

type TriggerInfo = {
    type: 'mention' | 'hashtag';
    start: number;
    query: string;
};

const MENTION_PATTERN = /@([a-zA-Z0-9_]{1,30})$/; // Require at least 1 character
const HASHTAG_PATTERN = /#([a-z0-9_]{1,120})$/; // Require at least 1 character
// Max lengths are encoded in the patterns above

export default function MentionHashtagAutocomplete({
    value,
    selectionStart,
    onInsert,
    textareaRef,
    disabled = false,
}: MentionHashtagAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [triggerInfo, setTriggerInfo] = useState<TriggerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const cacheRef = useRef<
        Map<string, { data: Suggestion[]; timestamp: number }>
    >(new Map());
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Detect trigger (@ or #) and extract query
    const detectTrigger = useCallback(
        (text: string, cursorPos: number): TriggerInfo | null => {
            const textBeforeCursor = text.substring(0, cursorPos);
            const lastSpace = textBeforeCursor.lastIndexOf(' ');
            const lastNewline = textBeforeCursor.lastIndexOf('\n');
            const searchStart = Math.max(lastSpace, lastNewline) + 1;
            const textToCheck = textBeforeCursor.substring(searchStart);

            // Check for mention first (must start with @ and have at least one character after)
            if (textToCheck.startsWith('@')) {
                const mentionMatch = textToCheck.match(MENTION_PATTERN);
                if (mentionMatch) {
                    const query = mentionMatch[1];
                    // Only show mention suggestions if there's at least one character after @
                    if (query.length >= 1) {
                        return {
                            type: 'mention',
                            start: searchStart,
                            query,
                        };
                    }
                }
                // Don't show mention suggestions for just @
                return null;
            }

            // Check for hashtag (must start with # and have at least one character after)
            if (textToCheck.startsWith('#')) {
                const hashtagMatch = textToCheck.match(HASHTAG_PATTERN);
                if (hashtagMatch) {
                    const query = hashtagMatch[1];
                    // Only show hashtag suggestions if there's at least one character after #
                    if (query.length >= 1) {
                        return {
                            type: 'hashtag',
                            start: searchStart,
                            query,
                        };
                    }
                }
                // Don't show hashtag suggestions for just #
                return null;
            }

            return null;
        },
        [],
    );

    // Fetch suggestions from API
    const fetchSuggestions = useCallback(
        async (type: 'mention' | 'hashtag', query: string) => {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Check cache (5 minute TTL)
            const cacheKey = `${type}:${query}`;
            const cached = cacheRef.current.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
                setSuggestions(cached.data);
                setIsLoading(false);
                return;
            }

            // Empty query - show popular/trending
            if (query === '') {
                setIsLoading(true);
                abortControllerRef.current = new AbortController();

                try {
                    const endpoint =
                        type === 'mention'
                            ? '/api/search/mentions'
                            : '/api/search/hashtags';
                    const response = await axios.get<{ data: Suggestion[] }>(
                        `${endpoint}?q=`,
                        {
                            signal: abortControllerRef.current.signal,
                        },
                    );

                    if (response.data.data) {
                        setSuggestions(response.data.data);
                        cacheRef.current.set(cacheKey, {
                            data: response.data.data,
                            timestamp: Date.now(),
                        });
                    }
                } catch (error) {
                    if (axios.isCancel(error)) {
                        return;
                    }
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setIsLoading(false);
                }

                return;
            }

            // Debounce API calls
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            setIsLoading(true);

            debounceTimerRef.current = setTimeout(async () => {
                abortControllerRef.current = new AbortController();

                try {
                    const endpoint =
                        type === 'mention'
                            ? '/api/search/mentions'
                            : '/api/search/hashtags';
                    const response = await axios.get<{ data: Suggestion[] }>(
                        `${endpoint}?q=${encodeURIComponent(query)}`,
                        {
                            signal: abortControllerRef.current.signal,
                        },
                    );

                    if (response.data.data) {
                        setSuggestions(response.data.data);
                        cacheRef.current.set(cacheKey, {
                            data: response.data.data,
                            timestamp: Date.now(),
                        });
                    }
                } catch (error) {
                    if (axios.isCancel(error)) {
                        return;
                    }
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setIsLoading(false);
                }
            }, 300);
        },
        [],
    );

    // Calculate dropdown position - centered below cursor
    const calculateDropdownPosition = useCallback(() => {
        if (!textareaRef.current || !triggerInfo) {
            return null;
        }

        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        const style = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(style.lineHeight) || 20;

        // Calculate approximate cursor position
        const textBeforeCursor = value.substring(0, selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length - 1;
        const paddingTop = parseFloat(style.paddingTop) || 0;

        // Calculate vertical position (below cursor)
        const cursorTop =
            rect.top + paddingTop + currentLine * lineHeight + lineHeight;

        // Dropdown dimensions
        const dropdownWidth = 320; // Fixed width for centering
        const dropdownHeight = 320; // Max height

        // Center horizontally relative to textarea
        // Position at cursor horizontally, but ensure it's centered and doesn't overflow
        const cursorLeft = rect.left + rect.width / 2;
        const left = cursorLeft - dropdownWidth / 2;

        // Ensure dropdown doesn't overflow viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 16; // Padding from viewport edges

        // Adjust horizontal position if it would overflow
        let adjustedLeft = left;
        if (adjustedLeft < padding) {
            adjustedLeft = padding;
        } else if (adjustedLeft + dropdownWidth > viewportWidth - padding) {
            adjustedLeft = viewportWidth - dropdownWidth - padding;
        }

        // Check if dropdown would go off-screen vertically, position above if needed
        const shouldPositionAbove =
            cursorTop + dropdownHeight > viewportHeight - padding;

        return {
            top: shouldPositionAbove
                ? cursorTop - dropdownHeight - lineHeight
                : cursorTop,
            left: adjustedLeft,
        };
    }, [textareaRef, triggerInfo, value, selectionStart]);

    // Update trigger detection and fetch suggestions
    useEffect(() => {
        if (disabled || !textareaRef.current) {
            setIsOpen(false);
            setTriggerInfo(null);
            return;
        }

        const trigger = detectTrigger(value, selectionStart);

        if (trigger) {
            setTriggerInfo(trigger);
            setSelectedIndex(0);
            setIsOpen(true);
            fetchSuggestions(trigger.type, trigger.query);
        } else {
            setIsOpen(false);
            setTriggerInfo(null);
            setSuggestions([]);
        }
    }, [
        value,
        selectionStart,
        detectTrigger,
        fetchSuggestions,
        disabled,
        textareaRef,
    ]);

    // Update dropdown position when trigger changes
    useEffect(() => {
        if (isOpen && triggerInfo) {
            const position = calculateDropdownPosition();
            setDropdownPosition(position);
        }
    }, [isOpen, triggerInfo, calculateDropdownPosition]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isOpen) {
                return;
            }

            // Allow navigation for hashtag "Add" option even when no suggestions
            const hasAddOption =
                suggestions.length === 0 &&
                triggerInfo?.type === 'hashtag' &&
                triggerInfo.query;

            if (suggestions.length === 0 && !hasAddOption) {
                return;
            }

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    if (hasAddOption) {
                        // Only one option (Add) so no navigation needed
                        return;
                    }
                    setSelectedIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : 0,
                    );
                    break;

                case 'ArrowUp':
                    event.preventDefault();
                    if (hasAddOption) {
                        // Only one option (Add) so no navigation needed
                        return;
                    }
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : suggestions.length - 1,
                    );
                    break;

                case 'Enter':
                case 'Tab':
                    event.preventDefault();
                    // Handle "Add" option for hashtags when no suggestions
                    if (
                        suggestions.length === 0 &&
                        triggerInfo?.type === 'hashtag' &&
                        triggerInfo.query
                    ) {
                        const insertText = `#${triggerInfo.query}`;
                        onInsert(insertText, triggerInfo.start, selectionStart);
                        setIsOpen(false);
                        setTriggerInfo(null);
                    } else if (suggestions[selectedIndex]) {
                        const suggestion = suggestions[selectedIndex];
                        const insertText =
                            triggerInfo?.type === 'mention'
                                ? `@${(suggestion as Mention).username}`
                                : `#${(suggestion as Hashtag).name}`;
                        const replaceStart = triggerInfo!.start;
                        const replaceEnd = selectionStart;
                        onInsert(insertText, replaceStart, replaceEnd);
                        setIsOpen(false);
                        setTriggerInfo(null);
                    }
                    break;

                case 'Escape':
                    event.preventDefault();
                    setIsOpen(false);
                    setTriggerInfo(null);
                    break;
            }
        },
        [
            isOpen,
            suggestions,
            selectedIndex,
            triggerInfo,
            selectionStart,
            onInsert,
        ],
    );

    // Attach keyboard event listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleKeyDown]);

    // Handle suggestion selection
    const handleSelect = useCallback(
        (suggestion: Suggestion) => {
            const insertText =
                triggerInfo?.type === 'mention'
                    ? `@${(suggestion as Mention).username}`
                    : `#${(suggestion as Hashtag).name}`;
            const replaceStart = triggerInfo!.start;
            const replaceEnd = selectionStart;
            onInsert(insertText, replaceStart, replaceEnd);
            setIsOpen(false);
            setTriggerInfo(null);
        },
        [triggerInfo, selectionStart, onInsert],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Render dropdown
    if (!isOpen || !dropdownPosition || disabled) {
        return null;
    }

    const dropdown = (
        <div
            ref={dropdownRef}
            className="fixed z-50 max-h-[320px] w-[320px] overflow-y-auto rounded-xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl"
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
            }}
        >
            {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-6">
                    <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-rose-400" />
                    <span className="text-sm text-white/60">Loading...</span>
                </div>
            ) : suggestions.length === 0 &&
              triggerInfo?.query &&
              triggerInfo.type === 'hashtag' ? (
                // Show "Add" option for hashtags when not found
                <ul className="py-1" role="listbox">
                    <li
                        role="option"
                        aria-selected={true}
                        className="cursor-pointer border-l-2 border-rose-400 bg-white/10 px-4 py-3 transition-all duration-150"
                        onClick={() => {
                            if (triggerInfo) {
                                const insertText = `#${triggerInfo.query}`;
                                onInsert(
                                    insertText,
                                    triggerInfo.start,
                                    selectionStart,
                                );
                                setIsOpen(false);
                                setTriggerInfo(null);
                            }
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                                <svg
                                    className="size-5 text-rose-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-white">
                                        Add #{triggerInfo.query}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-white/50">
                                    Create new hashtag
                                </span>
                            </div>
                        </div>
                    </li>
                </ul>
            ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-6">
                    <svg
                        className="size-8 text-white/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <span className="text-sm text-white/60">
                        No results found
                    </span>
                </div>
            ) : (
                <ul className="py-1" role="listbox">
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={
                                suggestion.type === 'user'
                                    ? `mention-${(suggestion as Mention).id}`
                                    : `hashtag-${(suggestion as Hashtag).id}`
                            }
                            role="option"
                            aria-selected={index === selectedIndex}
                            className={cn(
                                'cursor-pointer px-4 py-3 transition-all duration-150',
                                index === selectedIndex
                                    ? 'border-l-2 border-rose-400 bg-white/10'
                                    : 'border-l-2 border-transparent hover:bg-white/5',
                            )}
                            onClick={() => handleSelect(suggestion)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {suggestion.type === 'user' ? (
                                <MentionItem mention={suggestion as Mention} />
                            ) : (
                                <HashtagItem hashtag={suggestion as Hashtag} />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return createPortal(dropdown, document.body);
}

function MentionItem({ mention }: { mention: Mention }) {
    return (
        <div className="flex items-center gap-3">
            <Avatar className="size-10 flex-shrink-0 ring-2 ring-white/10">
                <AvatarImage
                    src={mention.avatar_url ?? undefined}
                    alt={mention.display_name ?? mention.username}
                />
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-500 text-sm font-semibold text-white">
                    {mention.display_name?.[0]?.toUpperCase() ??
                        mention.username[0]?.toUpperCase() ??
                        '?'}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                        {mention.display_name ?? mention.username}
                    </span>
                    {mention.verification_status && (
                        <div className="flex size-4 flex-shrink-0 items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/20">
                            <svg
                                className="size-2.5 text-blue-300"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    )}
                </div>
                <span className="truncate text-xs font-medium text-white/50">
                    @{mention.username}
                </span>
            </div>
        </div>
    );
}

function HashtagItem({ hashtag }: { hashtag: Hashtag }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                <svg
                    className="size-5 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                </svg>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                        #{hashtag.name}
                    </span>
                    {hashtag.usage_count !== undefined &&
                        hashtag.usage_count > 0 && (
                            <span className="flex-shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-xs font-medium text-white/50">
                                {hashtag.usage_count.toLocaleString()}
                            </span>
                        )}
                </div>
                {hashtag.recent_usage_count !== undefined &&
                    hashtag.recent_usage_count > 0 && (
                        <span className="text-xs font-medium text-rose-400/70">
                            Trending
                        </span>
                    )}
            </div>
        </div>
    );
}
