import LegalLayout from '@/layouts/legal-layout';
import { useEffect, useRef, useState } from 'react';

type HeadingItem = { id: string; text: string; level: number };

export default function LegalShow({
    title,
    content,
    updatedAt,
}: {
    title: string;
    content: string;
    updatedAt?: string | null;
}) {
    const articleRef = useRef<HTMLDivElement | null>(null);
    const [headings, setHeadings] = useState<HeadingItem[]>([]);

    useEffect(() => {
        if (!articleRef.current) return;
        const el = articleRef.current;
        const nodes = Array.from(
            el.querySelectorAll('h2, h3'),
        ) as HTMLElement[];
        const items: HeadingItem[] = [];
        nodes.forEach((node) => {
            const text = node.textContent ?? '';
            const base = text
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            const id = node.id || base || `section-${items.length + 1}`;
            node.id = id;
            items.push({ id, text, level: node.tagName === 'H2' ? 2 : 3 });
        });
        setHeadings(items);
    }, [content]);

    return (
        <LegalLayout title={title}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_-35px_rgba(249,115,22,0.45)] backdrop-blur">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                    {title}
                </h1>
                <p className="mt-2 text-sm text-white/65">
                    {updatedAt
                        ? `Last updated ${updatedAt}.`
                        : 'Updated content below.'}{' '}
                    For questions, contact support.
                </p>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/7">
                    <article
                        ref={articleRef as any}
                        className="prose prose-invert prose-headings:text-white prose-h1:mt-0 prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-3xl sm:prose-h2:text-4xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl sm:prose-h3:text-3xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-white/85 prose-p:mt-4 prose-p:mb-5 prose-ul:mt-4 prose-ul:mb-5 prose-li:text-white/80 prose-li:my-1.5 prose-a:text-amber-300 hover:prose-a:text-amber-200 mx-auto max-w-3xl p-6 text-[15px] leading-8 sm:p-8 sm:text-base md:p-10 md:text-[17px]"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
                <aside className="sticky top-24 h-fit rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold tracking-[0.3em] text-white/60 uppercase">
                        On this page
                    </p>
                    <nav className="mt-3 space-y-2">
                        {headings.length === 0 && (
                            <p className="text-xs text-white/50">
                                No sections detected.
                            </p>
                        )}
                        {headings.map((h) => (
                            <a
                                key={h.id}
                                href={`#${h.id}`}
                                className={[
                                    'block text-sm text-white/80 hover:text-white',
                                    h.level === 3 ? 'pl-3 text-white/70' : '',
                                ].join(' ')}
                            >
                                {h.text}
                            </a>
                        ))}
                    </nav>
                </aside>
            </div>
        </LegalLayout>
    );
}
