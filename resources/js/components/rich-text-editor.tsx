import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const allowedTags = ['strong', 'em', 'u', 's', 'br'];

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    placeholder?: string;
    className?: string;
};

const hasDomParser = typeof window !== 'undefined' && typeof DOMParser !== 'undefined';

const sanitizeHtml = (html: string): string => {
    if (!hasDomParser) {
        return html;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const nodes = doc.body.querySelectorAll('*');
    nodes.forEach((node) => {
        const tag = node.tagName.toLowerCase();

        if (!allowedTags.includes(tag)) {
            const parent = node.parentNode;
            if (!parent) {
                node.remove();
                return;
            }

            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            node.remove();
            return;
        }

        [...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name));
    });

    return doc.body.innerHTML || '';
};

const plainTextLength = (html: string): number => {
    if (!html) {
        return 0;
    }

    if (!hasDomParser) {
        return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').length;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return (doc.body.textContent ?? '').length;
};

const placeCursorAtEnd = (element: HTMLElement): void => {
    if (typeof window === 'undefined') {
        return;
    }

    const selection = window.getSelection();
    if (!selection) {
        return;
    }

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
};

const formatActions = [
    { label: 'Bold', command: 'bold', icon: Bold },
    { label: 'Italic', command: 'italic', icon: Italic },
    { label: 'Underline', command: 'underline', icon: Underline },
    { label: 'Strikethrough', command: 'strikeThrough', icon: Strikethrough },
];

export default function RichTextEditor({ value, onChange, maxLength, placeholder, className }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastHtmlRef = useRef<string>(value ?? '');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        if (value !== lastHtmlRef.current) {
            editorRef.current.innerHTML = value ?? '';
            lastHtmlRef.current = value ?? '';
        }
    }, [value]);

    const handleInput = () => {
        if (!editorRef.current) {
            return;
        }

        const rawHtml = editorRef.current.innerHTML;
        const sanitized = sanitizeHtml(rawHtml);

        if (plainTextLength(sanitized) > maxLength) {
            editorRef.current.innerHTML = lastHtmlRef.current;
            placeCursorAtEnd(editorRef.current);
            return;
        }

        if (sanitized !== rawHtml) {
            editorRef.current.innerHTML = sanitized;
            placeCursorAtEnd(editorRef.current);
        }

        lastHtmlRef.current = editorRef.current.innerHTML;
        onChange(lastHtmlRef.current);
    };

    const runCommand = (command: string) => {
        if (!editorRef.current) {
            return;
        }

    if (typeof document === 'undefined') {
        return;
    }

        editorRef.current.focus();
        document.execCommand(command);
        handleInput();
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div
                className={cn(
                    'relative rounded-2xl border border-white/10 bg-white/5 text-sm text-white transition focus-within:border-white/30 focus-within:ring-4 focus-within:ring-amber-500/20',
                )}
            >
                <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                    {formatActions.map(({ label, command, icon: Icon }) => (
                        <Button
                            key={command}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                            onClick={() => runCommand(command)}
                            aria-label={label}
                            tabIndex={-1}
                        >
                            <Icon className="size-4" />
                        </Button>
                    ))}
                </div>

                <div
                    ref={editorRef}
                    className="min-h-[220px] whitespace-pre-wrap break-words px-4 py-3 outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onBlur={() => setIsFocused(false)}
                    onFocus={() => setIsFocused(true)}
                />
                {!isFocused && !value && placeholder && (
                    <span className="pointer-events-none absolute left-4 top-[58px] text-sm text-white/40">{placeholder}</span>
                )}
            </div>

            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/45">
                {plainTextLength(value)}/{maxLength}
            </p>
        </div>
    );
}

