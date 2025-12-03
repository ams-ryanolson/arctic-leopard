import { Link } from '@inertiajs/react';
import { useMemo } from 'react';
import profileRoutes from '@/routes/profile';

type PostBodyProps = {
    body: string;
    className?: string;
};

type BodyPart = {
    type: 'text' | 'mention' | 'hashtag';
    content: string;
    link?: string;
};

export default function PostBody({ body, className = '' }: PostBodyProps) {
    const parsedBody = useMemo((): BodyPart[] => {
        if (!body) {
            return [];
        }

        const parts: BodyPart[] = [];
        const mentionPattern = /@([a-zA-Z0-9_]{1,30})/g;
        const hashtagPattern = /#([a-z0-9_]{1,120})/g;

        const matches: Array<{
            index: number;
            type: 'mention' | 'hashtag';
            content: string;
            fullMatch: string;
        }> = [];

        // Find all mentions
        let mentionMatch;
        while ((mentionMatch = mentionPattern.exec(body)) !== null) {
            matches.push({
                index: mentionMatch.index,
                type: 'mention',
                content: mentionMatch[1],
                fullMatch: mentionMatch[0],
            });
        }

        // Find all hashtags
        let hashtagMatch;
        while ((hashtagMatch = hashtagPattern.exec(body)) !== null) {
            matches.push({
                index: hashtagMatch.index,
                type: 'hashtag',
                content: hashtagMatch[1],
                fullMatch: hashtagMatch[0],
            });
        }

        // Sort matches by index
        matches.sort((a, b) => a.index - b.index);

        // Build parts array
        let lastIndex = 0;
        matches.forEach((match) => {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: body.substring(lastIndex, match.index),
                });
            }

            // Add match
            if (match.type === 'mention') {
                // Validate username format before creating link
                const isValidUsername = /^[a-zA-Z0-9_]{1,30}$/.test(match.content);
                if (isValidUsername) {
                    parts.push({
                        type: 'mention',
                        content: match.fullMatch,
                        link: profileRoutes.show.url(match.content),
                    });
                } else {
                    // Invalid username, render as plain text
                    parts.push({
                        type: 'text',
                        content: match.fullMatch,
                    });
                }
            } else {
                // Hashtag - always create link
                parts.push({
                    type: 'hashtag',
                    content: match.fullMatch,
                    link: `/hashtags/${encodeURIComponent(match.content.toLowerCase())}`,
                });
            }

            lastIndex = match.index + match.fullMatch.length;
        });

        // Add remaining text
        if (lastIndex < body.length) {
            parts.push({
                type: 'text',
                content: body.substring(lastIndex),
            });
        }

        // If no matches, return the whole body as text
        if (parts.length === 0) {
            parts.push({
                type: 'text',
                content: body,
            });
        }

        return parts;
    }, [body]);

    return (
        <p
            className={`whitespace-pre-line text-sm sm:text-base leading-relaxed ${className}`}
        >
            {parsedBody.map((part, index) => {
                if (part.type === 'text') {
                    return <span key={index}>{part.content}</span>;
                }

                if (part.type === 'mention' && part.link) {
                    return (
                        <Link
                            key={index}
                            href={part.link}
                            prefetch
                            className="text-blue-400 font-medium hover:text-blue-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
                        >
                            {part.content}
                        </Link>
                    );
                }

                if (part.type === 'hashtag' && part.link) {
                    return (
                        <Link
                            key={index}
                            href={part.link}
                            prefetch
                            className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
                        >
                            {part.content}
                        </Link>
                    );
                }

                // Fallback to plain text
                return <span key={index}>{part.content}</span>;
            })}
        </p>
    );
}

