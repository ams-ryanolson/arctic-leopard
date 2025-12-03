import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

type CompactTextareaProps = {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
    onTyping?: () => void;
    maxRows?: number;
};

/**
 * Compact auto-expanding textarea that starts as a single line
 * and grows as content is added, similar to Twitter/X's input design.
 */
export default function CompactTextarea({
    value,
    onChange,
    onKeyDown,
    placeholder = 'Message',
    className,
    onTyping,
    maxRows = 8,
}: CompactTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize functionality
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        // Reset height to get accurate scrollHeight
        textarea.style.height = 'auto';

        // Calculate new height based on content
        const lineHeight = 24; // Approximate line height in pixels
        const minHeight = lineHeight + 8; // Single line height + padding
        const maxHeight = lineHeight * maxRows + 8;

        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

        textarea.style.height = `${newHeight}px`;
    }, [maxRows]);

    // Adjust height when value changes
    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(event.target.value);
            adjustHeight();
            onTyping?.();
        },
        [onChange, adjustHeight, onTyping],
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (onKeyDown) {
                onKeyDown(event);
            }
            // Adjust height after key press (for Enter key)
            setTimeout(adjustHeight, 0);
        },
        [onKeyDown, adjustHeight],
    );

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
                'w-full resize-none overflow-hidden rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-0',
                className,
            )}
            data-message-textarea
            style={{ height: 'auto', minHeight: '24px' }}
        />
    );
}

