import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Attachment } from './types';

type MessageImageLightboxProps = {
    attachments: Attachment[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    startIndex?: number;
};

export default function MessageImageLightbox({
    attachments,
    open,
    onOpenChange,
    startIndex = 0,
}: MessageImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex, open]);

    const currentAttachment = attachments[currentIndex];
    const hasMultiple = attachments.length > 1;

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) =>
            prev > 0 ? prev - 1 : attachments.length - 1,
        );
    }, [attachments.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) =>
            prev < attachments.length - 1 ? prev + 1 : 0,
        );
    }, [attachments.length]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handlePrevious();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                handleNext();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                onOpenChange(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, handlePrevious, handleNext, onOpenChange]);

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-neutral-950/95 backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[120] flex flex-col focus:outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
                    aria-label="Image lightbox"
                >
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
                        {currentAttachment &&
                        currentAttachment.type === 'image' ? (
                            <>
                                <img
                                    src={
                                        currentAttachment.optimized_url ??
                                        currentAttachment.url
                                    }
                                    alt={currentAttachment.filename}
                                    className="max-h-full max-w-full rounded-2xl border border-white/10 bg-black object-contain shadow-[0_35px_60px_-25px_rgba(0,0,0,0.8)]"
                                />
                                {hasMultiple && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handlePrevious}
                                            className="group absolute top-1/2 left-6 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/80 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40"
                                        >
                                            <span className="sr-only">
                                                View previous image
                                            </span>
                                            <ChevronLeft className="size-6 transition group-hover:scale-110" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="group absolute top-1/2 right-6 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/80 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40"
                                        >
                                            <span className="sr-only">
                                                View next image
                                            </span>
                                            <ChevronRight className="size-6 transition group-hover:scale-110" />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>

                    <div className="absolute top-4 right-4">
                        <DialogPrimitive.Close
                            aria-label="Close lightbox"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>

                    {hasMultiple && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-xl">
                            <p className="text-xs font-medium text-white/70">
                                {currentIndex + 1} / {attachments.length}
                            </p>
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
