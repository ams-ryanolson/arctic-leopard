export function normalizeNumeric(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);

        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    const fallback = Number(value);

    return Number.isFinite(fallback) ? fallback : 0;
}

export function formatRelativeTime(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return 'just now';
    }

    if (diff < hour) {
        const value = Math.round(diff / minute);

        return value === 1 ? '1 min ago' : `${value} min ago`;
    }

    if (diff < day) {
        const value = Math.round(diff / hour);

        return value === 1 ? '1 hr ago' : `${value} hr ago`;
    }

    return date.toLocaleDateString();
}

/**
 * Format timestamp for message bubbles (like Twitter: "2:19 PM")
 */
export function formatMessageTime(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format date separator (like Twitter: "Aug 4, 2024", "Sep 22, 2024", "Tue, Nov 11")
 */
export function formatDateSeparator(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    // Today
    if (diffDays === 0) {
        return 'Today';
    }

    // Yesterday
    if (diffDays === 1) {
        return 'Yesterday';
    }

    // This year - show "Mon, Nov 11" format
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }

    // Previous years - show "Aug 4, 2024" format
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date | string | null, date2: Date | string | null): boolean {
    if (!date1 || !date2) {
        return false;
    }

    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
        return false;
    }

    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

export function isOnlyEmojis(text: string | null | undefined): boolean {
    if (!text || text.trim() === '') {
        return false;
    }

    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
        return false;
    }

    // Comprehensive emoji regex that matches:
    // - Emoticons (😀-🙏) U+1F600-U+1F64F
    // - Miscellaneous Symbols and Pictographs U+1F300-U+1F5FF
    // - Transport and Map Symbols U+1F680-U+1F6FF
    // - Supplemental Symbols and Pictographs U+1F900-U+1F9FF
    // - Symbols & Pictographs Extended-A U+1FA00-U+1FAFF
    // - Dingbats U+2700-U+27BF
    // - Miscellaneous Symbols U+2600-U+26FF
    // - Emoji modifiers (skin tones) U+1F3FB-U+1F3FF
    // - Variation selectors U+FE00-U+FE0F
    // - Zero Width Joiner U+200D (for emoji sequences)
    // - Regional indicator symbols U+1F1E0-U+1F1FF (for flags)
    // - Keycap base U+20E3
    // - Combining enclosing keycap U+FE0F (optional)
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{1F1E0}-\u{1F1FF}]/gu;
    
    // Remove all emojis and related characters from the text
    const textWithoutEmojis = trimmed.replace(emojiPattern, '').trim();
    
    // Check if we found any emoji characters
    const hasEmojis = emojiPattern.test(trimmed);
    
    // Reset regex lastIndex for future tests
    emojiPattern.lastIndex = 0;
    
    // If we have emojis and no remaining text, it's emoji-only
    return hasEmojis && textWithoutEmojis.length === 0;
}

export function formatCurrency(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

export function normalizeMessage(raw: any): any {
    return {
        ...raw,
        id: normalizeNumeric(raw.id),
        conversation_id: normalizeNumeric(raw.conversation_id),
        sequence: normalizeNumeric(raw.sequence),
    };
}

