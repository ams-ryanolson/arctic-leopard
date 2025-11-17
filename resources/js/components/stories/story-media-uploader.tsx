import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCsrfToken } from '@/lib/csrf';

export type StoryUploadedMedia = {
    clientId: string;
    identifier?: string | null;
    disk?: string;
    path?: string;
    url?: string | null;
    thumbnail_url?: string | null;
    mime_type?: string;
    size?: number;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
};

type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

type UploadItem = {
    clientId: string;
    file?: File;
    previewUrl: string;
    status: UploadStatus;
    progress: number;
    error?: string;
    response?: StoryUploadedMedia;
    xhr?: XMLHttpRequest;
};

export type StoryMediaUploaderProps = {
    value?: StoryUploadedMedia | null;
    onChange?: (item: StoryUploadedMedia | null) => void;
    disabled?: boolean;
    className?: string;
    acceptedMimeTypes?: string[];
};

type UploadResponsePayload = Partial<{
    id: string | number | null;
    disk: string | null;
    path: string | null;
    url: string | null;
    thumbnail_url: string | null;
    mime_type: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    duration: number | null;
}>;

export default function StoryMediaUploader({
    value,
    onChange,
    disabled = false,
    className,
    acceptedMimeTypes,
}: StoryMediaUploaderProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const dropRef = useRef<HTMLDivElement | null>(null);
    const [item, setItem] = useState<UploadItem | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    const acceptAttribute = acceptedMimeTypes && acceptedMimeTypes.length ? acceptedMimeTypes.join(',') : undefined;
    const hasItem = item !== null && item.status !== 'idle';

    useEffect(() => {
        if (!value) {
            setItem(null);
            return;
        }

        setItem({
            clientId: value.clientId ?? `uploaded-${value.identifier ?? Date.now()}`,
            previewUrl: value.thumbnail_url ?? value.url ?? '',
            status: 'uploaded',
            progress: 100,
            response: value,
        });
    }, [value]);

    const finalizeSuccess = useCallback(
        (clientId: string, payload: UploadResponsePayload | null | undefined) => {
            if (!payload || typeof payload !== 'object') {
                setItem((prev) => (prev?.clientId === clientId ? { ...prev, status: 'error', error: 'Invalid response' } : prev));
                return;
            }

            const uploaded: StoryUploadedMedia = {
                clientId,
                identifier: payload.id?.toString() ?? null,
                disk: payload.disk ?? undefined,
                path: payload.path ?? undefined,
                url: payload.url ?? undefined,
                thumbnail_url: payload.thumbnail_url ?? undefined,
                mime_type: payload.mime_type ?? undefined,
                size: payload.size ?? undefined,
                width: payload.width ?? undefined,
                height: payload.height ?? undefined,
                duration: payload.duration ?? undefined,
            };

            setItem((prev) =>
                prev?.clientId === clientId
                    ? {
                          ...prev,
                          status: 'uploaded',
                          progress: 100,
                          response: uploaded,
                          xhr: undefined,
                      }
                    : prev,
            );

            onChange?.(uploaded);
        },
        [onChange],
    );

    const finalizeError = useCallback(
        (clientId: string, message: string) => {
            setItem((prev) =>
                prev?.clientId === clientId
                    ? {
                          ...prev,
                          status: 'error',
                          progress: 0,
                          error: message,
                          xhr: undefined,
                      }
                    : prev,
            );
        },
        [],
    );

    const beginUpload = useCallback(
        (clientId: string, file: File) => {
            const xhr = new XMLHttpRequest();
            const headers: Record<string, string> = {
                'X-Requested-With': 'XMLHttpRequest',
            };

            const csrfToken = getCsrfToken();

            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            xhr.open('POST', '/uploads/tmp');
            xhr.withCredentials = true;
            xhr.responseType = 'json';

            Object.entries(headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) {
                    setItem((prev) =>
                        prev?.clientId === clientId
                            ? {
                                  ...prev,
                                  progress: Math.min((prev.progress ?? 0) + 5, 95),
                              }
                            : prev,
                    );
                    return;
                }

                const progress = Math.round((event.loaded / event.total) * 100);
                setItem((prev) =>
                    prev?.clientId === clientId
                        ? {
                              ...prev,
                              progress,
                          }
                        : prev,
                );
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const payload = xhr.response ?? (() => {
                        try {
                            return JSON.parse(xhr.responseText);
                        } catch {
                            return null;
                        }
                    })();

                    if (payload && typeof payload === 'object') {
                        finalizeSuccess(clientId, payload);
                        return;
                    }

                    finalizeError(clientId, 'Upload succeeded but response was malformed.');
                    return;
                }

                const errorPayload = (() => {
                    try {
                        return JSON.parse(xhr.responseText);
                    } catch {
                        return null;
                    }
                })();

                const message =
                    errorPayload?.message ??
                    (errorPayload?.errors ? Object.values(errorPayload.errors).flat().join(' ') : null) ??
                    'Upload failed. Please try again.';

                finalizeError(clientId, message);
            };

            xhr.onerror = () => {
                finalizeError(clientId, 'Network error. Please retry.');
            };

            xhr.onabort = () => {
                finalizeError(clientId, 'Upload cancelled.');
            };

            const formData = new FormData();
            formData.append('file', file, file.name);

            setItem({
                clientId,
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'uploading',
                progress: 0,
                xhr,
            });

            xhr.send(formData);
        },
        [finalizeError, finalizeSuccess],
    );

    const handleFileSelect = useCallback(
        (file: File) => {
            setValidationMessage(null);

            if (!file.type.match(/^(image|video)\//)) {
                setValidationMessage('Please select an image or video file.');
                return;
            }

            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                setValidationMessage('File size must be less than 50MB.');
                return;
            }

            const clientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
            beginUpload(clientId, file);
        },
        [beginUpload],
    );

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                handleFileSelect(file);
            }
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [handleFileSelect],
    );

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragging(false);

            if (disabled || hasItem) {
                return;
            }

            const file = event.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        },
        [disabled, hasItem, handleFileSelect],
    );

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!disabled && !hasItem) {
            setIsDragging(true);
        }
    }, [disabled, hasItem]);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    }, []);

    const handleRemove = useCallback(() => {
        if (item?.xhr) {
            item.xhr.abort();
        }

        if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
        }

        setItem(null);
        onChange?.(null);
        setValidationMessage(null);
    }, [item, onChange]);

    const handleClick = useCallback(() => {
        if (disabled || hasItem) {
            return;
        }
        inputRef.current?.click();
    }, [disabled, hasItem]);

    const isImage = item?.response?.mime_type?.startsWith('image/') ?? item?.file?.type.startsWith('image/') ?? false;
    const isVideo = item?.response?.mime_type?.startsWith('video/') ?? item?.file?.type.startsWith('video/') ?? false;

    return (
        <div className={cn('relative', className)}>
            <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                className={cn(
                    'relative flex h-64 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition',
                    isDragging ? 'border-amber-400 bg-amber-400/10' : 'border-white/20 bg-white/5',
                    disabled || hasItem ? 'cursor-not-allowed opacity-50' : 'hover:border-white/40',
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptAttribute}
                    onChange={handleInputChange}
                    disabled={disabled || hasItem}
                    className="hidden"
                />

                {!hasItem && (
                    <div className="flex flex-col items-center gap-2 text-white/70">
                        <UploadCloud className="size-8" />
                        <div className="text-center">
                            <p className="text-sm font-medium">Click or drag to upload</p>
                            <p className="text-xs">Image or video (max 50MB)</p>
                        </div>
                    </div>
                )}

                {hasItem && item.previewUrl && (
                    <>
                        {isImage && (
                            <img
                                src={item.previewUrl}
                                alt="Preview"
                                className="h-full w-full object-cover"
                            />
                        )}
                        {isVideo && (
                            <video
                                src={item.previewUrl}
                                className="h-full w-full object-cover"
                                controls={false}
                                muted
                            />
                        )}

                        {item.status === 'uploading' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="size-8 animate-spin text-white" />
                                    <p className="text-sm text-white">{item.progress}%</p>
                                </div>
                            </div>
                        )}

                        {item.status === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-900/60">
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <p className="text-sm font-medium text-white">Upload failed</p>
                                    <p className="text-xs text-white/80">{item.error}</p>
                                </div>
                            </div>
                        )}

                        {!disabled && item.status === 'uploaded' && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </>
                )}
            </div>

            {validationMessage && (
                <p className="mt-2 text-sm text-red-400">{validationMessage}</p>
            )}
        </div>
    );
}

