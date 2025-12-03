import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type MediaPreviewProps = {
    file: File;
    progress?: number;
    error?: string | null;
    uploading?: boolean;
    onRemove?: () => void;
    className?: string;
};

export default function MediaPreview({
    file,
    progress = 0,
    error = null,
    uploading = false,
    onRemove,
    className,
}: MediaPreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setObjectUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    return (
        <div className={cn('relative overflow-hidden rounded-lg', className)}>
            {isImage && objectUrl && (
                <img
                    src={objectUrl}
                    alt={file.name}
                    className="h-full w-full object-cover"
                />
            )}

            {isVideo && objectUrl && (
                <video
                    src={objectUrl}
                    className="h-full w-full object-cover"
                    muted
                />
            )}

            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-center">
                        <Loader2 className="mx-auto size-8 animate-spin text-white" />
                        {progress > 0 && (
                            <p className="mt-2 text-sm text-white">
                                {progress}%
                            </p>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur-sm">
                    <p className="px-4 text-sm text-white">{error}</p>
                </div>
            )}

            {onRemove && !uploading && (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={onRemove}
                >
                    <X className="size-4" />
                </Button>
            )}
        </div>
    );
}
