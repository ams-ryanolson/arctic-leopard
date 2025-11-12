import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PaginationMeta = {
    currentPage: number;
    perPage: number;
    total: number;
    hasMorePages: boolean;
};

type PaginationProps = {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    className?: string;
    label?: string;
};

const getVisiblePages = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | 'ellipsis'> = [1];

    if (currentPage > 3) {
        pages.push('ellipsis');
    }

    const middlePages = [currentPage - 1, currentPage, currentPage + 1]
        .filter((page) => page > 1 && page < totalPages);

    pages.push(...middlePages);

    if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
    }

    pages.push(totalPages);

    return pages;
};

export function Pagination({
    meta,
    onPageChange,
    className,
    label = 'Pagination',
}: PaginationProps) {
    const totalPages = Math.max(
        1,
        Math.ceil((meta.total || 0) / (meta.perPage || Math.max(meta.total, 1))),
    );
    const canGoPrevious = meta.currentPage > 1;
    const canGoNext = meta.hasMorePages && meta.currentPage < totalPages;

    if (totalPages <= 1) {
        return null;
    }

    const pages = getVisiblePages(meta.currentPage, totalPages);

    return (
        <nav
            aria-label={label}
            className={cn(
                'flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 shadow-[0_30px_70px_-45px_rgba(249,115,22,0.45)] sm:flex-row sm:items-center sm:justify-between sm:p-6',
                className,
            )}
        >
            <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                    Page {meta.currentPage} of {totalPages}
                </p>
                <p className="text-xs text-white/60">
                    Showing{' '}
                    {Math.max(
                        0,
                        Math.min(
                            meta.perPage,
                            meta.total - (meta.currentPage - 1) * meta.perPage,
                        ),
                    )}{' '}
                    results this page · {meta.total} total
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrevious}
                    onClick={() => canGoPrevious && onPageChange(meta.currentPage - 1)}
                    className="rounded-full border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white disabled:border-white/10 disabled:text-white/40"
                >
                    Previous
                </Button>

                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1">
                    {pages.map((page, index) =>
                        page === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-xs text-white/50"
                            >
                                …
                            </span>
                        ) : (
                            <Button
                                key={page}
                                type="button"
                                size="sm"
                                variant={page === meta.currentPage ? 'default' : 'ghost'}
                                onClick={() => onPageChange(page)}
                                className={cn(
                                    'rounded-full px-3 text-xs uppercase tracking-[0.3em]',
                                    page === meta.currentPage
                                        ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_16px_45px_-25px_rgba(249,115,22,0.65)] hover:scale-[1.02]'
                                        : 'text-white/75 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                {page}
                            </Button>
                        ),
                    )}
                </div>

                <Button
                    type="button"
                    size="sm"
                    disabled={!canGoNext}
                    onClick={() => canGoNext && onPageChange(meta.currentPage + 1)}
                    className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.02] disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                >
                    Next
                </Button>
            </div>
        </nav>
    );
}


