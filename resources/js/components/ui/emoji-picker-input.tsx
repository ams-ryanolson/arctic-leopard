import { useRef, useState, useCallback, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmojiPickerInputProps = {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    onTyping?: () => void;
};

export default function EmojiPickerInput({
    value,
    onChange,
    onKeyDown,
    placeholder = 'Write a message…',
    rows = 4,
    className,
    onTyping,
}: EmojiPickerInputProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleEmojiClick = useCallback(
        (emojiData: EmojiClickData) => {
            const emoji = emojiData.emoji;
            const textarea = textareaRef.current;

            onChange((prevBody) => {
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const textBefore = prevBody.substring(0, start);
                    const textAfter = prevBody.substring(end);
                    const newBody = textBefore + emoji + textAfter;

                    setTimeout(() => {
                        if (textarea) {
                            textarea.focus();
                            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                        }
                    }, 0);

                    return newBody;
                }

                return prevBody + emoji;
            });

            setShowEmojiPicker(false);
            onTyping?.();
        },
        [onChange, onTyping],
    );

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(event.target.value);
            onTyping?.();
        },
        [onChange, onTyping],
    );

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showEmojiPicker]);

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                rows={rows}
                className={cn(
                    'h-14 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-10 text-sm text-white/90 placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:h-28 sm:rounded-2xl sm:px-4 sm:py-3 sm:pr-12',
                    className,
                )}
            />
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-8"
                    aria-label="Add emoji"
                >
                    <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-50">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.DARK}
                            width={350}
                            height={400}
                            previewConfig={{
                                showPreview: false,
                            }}
                            skinTonesDisabled
                        />
                    </div>
                )}
            </div>
        </div>
    );
}


