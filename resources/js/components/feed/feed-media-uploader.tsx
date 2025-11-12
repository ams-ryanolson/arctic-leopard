import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Star, Trash2, UploadCloud } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getCsrfToken } from '@/lib/csrf';

export type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

export type FeedUploadedMedia = {
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
    isPrimary?: boolean;
};

type UploadItem = {
    clientId: string;
    file?: File;
    previewUrl: string;
    status: UploadStatus;
    progress: number;
    error?: string;
    response?: FeedUploadedMedia;
    isPrimary: boolean;
    xhr?: XMLHttpRequest;
};

export type FeedUploaderItemSummary = {
    clientId: string;
    status: UploadStatus;
    progress: number;
    isPrimary: boolean;
    error?: string;
};

export type FeedMediaUploaderProps = {
    maxFiles?: number;
    acceptedMimeTypes?: string[];
    value?: FeedUploadedMedia[];
    onChange?: (items: FeedUploadedMedia[]) => void;
    onItemsChange?: (items: FeedUploaderItemSummary[]) => void;
    disabled?: boolean;
    className?: string;
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

export default function FeedMediaUploader({
    maxFiles = 6,
    acceptedMimeTypes,
    value,
    onChange,
    onItemsChange,
    disabled = false,
    className,
}: FeedMediaUploaderProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const dropRef = useRef<HTMLDivElement | null>(null);
    const [items, setItems] = useState<UploadItem[]>([]);
    const itemsRef = useRef<UploadItem[]>([]);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const acceptAttribute = useMemo(
        () => (acceptedMimeTypes && acceptedMimeTypes.length ? acceptedMimeTypes.join(',') : undefined),
        [acceptedMimeTypes],
    );
    const atCapacity = items.length >= maxFiles;
    const dropDisabled = disabled || atCapacity;

    useEffect(() => {
        if (!value || value.length === 0) {
             
            setItems([]);
            return;
        }

         
        setItems(
            value.map((uploaded, index) => ({
                clientId: uploaded.clientId ?? `${uploaded.identifier ?? `uploaded-${index}`}`,
                previewUrl: uploaded.thumbnail_url ?? uploaded.url ?? '',
                status: 'uploaded' as UploadStatus,
                progress: 100,
                response: uploaded,
                isPrimary: index === 0,
            })),
        );
    }, [value]);

    useEffect(() => {
        if (!onChange) {
            return;
        }

        const uploaded = items
            .filter((item) => item.status === 'uploaded' && item.response)
            .map((item) => ({
                ...item.response!,
                clientId: item.clientId,
            }));

        onChange(uploaded);
    }, [items, onChange]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(
        () => () => {
            itemsRef.current.forEach((item) => {
                if (item.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.previewUrl);
                }
                item.xhr?.abort();
            });
        },
        [],
    );

    const updateItem = useCallback(
        (clientId: string, updater: (item: UploadItem) => UploadItem) => {
            setItems((previous) =>
                previous.map((item) => {
                    if (item.clientId !== clientId) {
                        return item;
                    }

                    return updater(item);
                }),
            );
        },
        [],
    );

    const finalizeSuccess = useCallback(
        (clientId: string, payload: UploadResponsePayload | null | undefined) => {
            const response: FeedUploadedMedia = {
                clientId,
                identifier: payload?.id ?? null,
                disk: payload?.disk,
                path: payload?.path,
                url: payload?.url ?? null,
                thumbnail_url: payload?.thumbnail_url ?? payload?.url ?? null,
                mime_type: payload?.mime_type,
                size: payload?.size,
                width: payload?.width ?? null,
                height: payload?.height ?? null,
                duration: payload?.duration ?? null,
            };

            updateItem(clientId, (item) => ({
                ...item,
                status: 'uploaded',
                progress: 100,
                error: undefined,
                response,
                xhr: undefined,
            }));
        },
        [updateItem],
    );

    const finalizeError = useCallback(
        (clientId: string, message: string) => {
            updateItem(clientId, (item) => ({
                ...item,
                status: 'error',
                progress: 0,
                error: message,
                xhr: undefined,
            }));
        },
        [updateItem],
    );

    const beginUpload = useCallback(
        (clientId: string, file: File) => {
            const xhr = new XMLHttpRequest();
            console.info('[FeedMediaUploader] begin upload', { clientId, name: file.name, size: file.size, type: file.type });
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
                console.debug('[FeedMediaUploader] upload progress event', { clientId, loaded: event.loaded, total: event.total, lengthComputable: event.lengthComputable });
                if (!event.lengthComputable) {
                    updateItem(clientId, (item) => ({
                        ...item,
                        progress: Math.min(item.progress + 5, 95),
                    }));
                    return;
                }

                const progress = Math.round((event.loaded / event.total) * 100);
                updateItem(clientId, (item) => ({
                    ...item,
                    progress,
                }));
            };

            xhr.onload = () => {
                console.info('[FeedMediaUploader] upload load', { clientId, status: xhr.status, response: xhr.response ?? xhr.responseText });
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
                console.error('[FeedMediaUploader] upload error', { clientId });
                finalizeError(clientId, 'Network error. Please retry.');
            };

            xhr.onabort = () => {
                console.warn('[FeedMediaUploader] upload aborted', { clientId });
                finalizeError(clientId, 'Upload cancelled.');
            };

            const formData = new FormData();
            formData.append('file', file, file.name);

            updateItem(clientId, (item) => ({
                ...item,
                status: 'uploading',
                progress: 0,
                error: undefined,
                xhr,
            }));

            xhr.send(formData);
        },
        [finalizeError, finalizeSuccess, updateItem],
    );

    const retryUpload = useCallback(
        (clientId: string) => {
            let retryFile: File | undefined;
            setItems((previous) =>
                previous.map((item) => {
                    if (item.clientId !== clientId) {
                        return item;
                    }

                    retryFile = item.file;

                    return {
                        ...item,
                        status: 'uploading',
                        progress: 0,
                        error: undefined,
                    };
                }),
            );

            if (retryFile) {
                beginUpload(clientId, retryFile);
            }
        },
        [beginUpload],
    );
    useEffect(() => {
        const handleWindowDragOver = (event: DragEvent) => {
            if (dropDisabled) {
                return;
            }

            if (dropRef.current?.contains(event.target as Node)) {
                event.preventDefault();
                setIsDragging(true);
            }
        };

        const handleWindowDragLeave = (event: DragEvent) => {
            if (dropRef.current && !dropRef.current.contains(event.relatedTarget as Node)) {
                setIsDragging(false);
            }
        };

        window.addEventListener('dragover', handleWindowDragOver);
        window.addEventListener('dragleave', handleWindowDragLeave);

        return () => {
            window.removeEventListener('dragover', handleWindowDragOver);
            window.removeEventListener('dragleave', handleWindowDragLeave);
        };
    }, [dropDisabled]);

    const handleBrowse = useCallback(() => {
        if (dropDisabled) {
            return;
        }

        inputRef.current?.click();
    }, [dropDisabled]);

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList || dropDisabled) {
                console.warn('[FeedMediaUploader] handleFiles skipped', { reason: dropDisabled ? 'disabled-or-capacity' : 'no-files' });
                return;
            }

            const availableSlots = Math.max(0, maxFiles - items.length);

            if (availableSlots <= 0) {
                setValidationMessage(`You can upload up to ${maxFiles} files.`);
                console.warn('[FeedMediaUploader] handleFiles capacity reached', { maxFiles, current: items.length });
                return;
            }

            const candidates = Array.from(fileList);
            const limitedFiles = candidates.slice(0, availableSlots);

            const isAcceptedMimeType = (type: string) => {
                if (!acceptedMimeTypes || acceptedMimeTypes.length === 0) {
                    return true;
                }

                return acceptedMimeTypes.some((pattern) => {
                    if (pattern === type) {
                        return true;
                    }

                    if (pattern.endsWith('/*')) {
                        const prefix = pattern.slice(0, pattern.length - 1);
                        return type.startsWith(prefix);
                    }

                    return type === pattern;
                });
            };

            const validFiles: File[] = [];
            const invalidFiles: File[] = [];

            limitedFiles.forEach((file) => {
                const accepted = isAcceptedMimeType(file.type);
                console.debug('[FeedMediaUploader] mime check', {
                    name: file.name,
                    type: file.type,
                    acceptedMimeTypes,
                    accepted,
                });
                if (accepted) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push(file);
                }
            });

            if (invalidFiles.length) {
                console.warn('[FeedMediaUploader] unsupported file types', { files: invalidFiles.map((file) => ({ name: file.name, type: file.type })) });
                setValidationMessage(
                    `Unsupported file type: ${invalidFiles.map((file) => file.name).join(', ')}.`,
                );
            }

            if (!validFiles.length) {
                console.warn('[FeedMediaUploader] no valid files to upload');
                return;
            }

            setValidationMessage(null);
            console.info('[FeedMediaUploader] starting uploads', { files: validFiles.map((file) => ({ name: file.name, size: file.size, type: file.type })) });

            const newUploadItems = validFiles.map((file, index) => {
                const clientId =
                    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const url = URL.createObjectURL(file);

                return {
                    clientId,
                    file,
                    previewUrl: url,
                    status: 'uploading' as UploadStatus,
                    progress: 0,
                    isPrimary: items.length === 0 && index === 0,
                };
            });

            setItems((previous) => {
                const next = [...previous, ...newUploadItems];

                if (next.length > 0 && next.every((item) => !item.isPrimary)) {
                    next[0] = { ...next[0], isPrimary: true };
                }

                return next;
            });

            console.info('[FeedMediaUploader] queued uploads', newUploadItems.map(({ clientId, file }) => ({
                clientId,
                name: file.name,
                size: file.size,
                type: file.type,
            })));

            newUploadItems.forEach(({ clientId, file }) => beginUpload(clientId, file));
        },
        [acceptedMimeTypes, beginUpload, dropDisabled, items.length, maxFiles],
    );

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            console.info('[FeedMediaUploader] input change', { fileCount: event.target.files?.length ?? 0 });
            handleFiles(event.target.files);
            event.target.value = '';
        },
        [handleFiles],
    );

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            if (dropDisabled) {
                return;
            }

            event.preventDefault();
            setIsDragging(false);
            console.info('[FeedMediaUploader] drop event', { fileCount: event.dataTransfer.files?.length ?? 0 });
            handleFiles(event.dataTransfer.files);
        },
        [dropDisabled, handleFiles],
    );

    const removeItem = useCallback((clientId: string) => {
        setItems((previous) => {
            const next = previous.filter((item) => item.clientId !== clientId);

            const removed = previous.find((item) => item.clientId === clientId);
            if (removed) {
                if (removed.status === 'uploading') {
                    removed.xhr?.abort();
                }
                if (removed.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(removed.previewUrl);
                }
            }

            if (next.length > 0 && next.every((item) => !item.isPrimary)) {
                next[0] = { ...next[0], isPrimary: true };
            }

            return next;
        });
        setValidationMessage(null);
        console.info('[FeedMediaUploader] item removed', { clientId });
    }, []);

    const setPrimary = useCallback((clientId: string) => {
        setItems((previous) =>
            previous.map((item) => ({
                ...item,
                isPrimary: item.clientId === clientId,
            })),
        );
    }, []);

    const previews = useMemo(() => items, [items]);

    useEffect(() => {
        if (!onItemsChange) {
            return;
        }

        onItemsChange(
            items.map<FeedUploaderItemSummary>((item) => ({
                clientId: item.clientId,
                status: item.status,
                progress: item.progress,
                isPrimary: item.isPrimary,
                error: item.error,
            })),
        );
    }, [items, onItemsChange]);

    return (
        <div className={cn('space-y-4', className)}>
            <div
                ref={dropRef}
                className={cn(
                    'relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center transition',
                    dropDisabled && 'cursor-not-allowed opacity-60',
                    !dropDisabled && 'cursor-pointer hover:border-white/40 hover:bg-white/10',
                    isDragging && !dropDisabled && 'border-white/60 bg-white/15',
                )}
                onClick={dropDisabled ? undefined : handleBrowse}
                onDragOver={(event) => {
                    if (dropDisabled) {
                        return;
                    }

                    event.preventDefault();
                }}
                onDragLeave={() => !dropDisabled && setIsDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={dropDisabled ? -1 : 0}
                aria-disabled={dropDisabled}
                aria-label="Upload media"
            >
                <UploadCloud className="mb-4 size-10 text-white/50" />
                <p className="text-sm text-white/70">
                    Drag &amp; drop media, or <span className="text-white underline">browse</span>
                </p>
                <p className="mt-2 text-xs text-white/40">
                    {maxFiles} files max{acceptedMimeTypes?.length ? ` · ${acceptedMimeTypes.join(', ')}` : ''}
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={acceptAttribute}
                    className="hidden"
                    disabled={dropDisabled}
                    onChange={handleInputChange}
                />
            </div>

            {validationMessage && (
                <p className="px-2 text-xs text-rose-300">{validationMessage}</p>
            )}

            {previews.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {previews.map((item) => (
                        <article
                            key={item.clientId}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35"
                        >
                            {item.previewUrl ? (
                                <img
                                    src={item.previewUrl}
                                    alt={item.response?.mime_type ?? 'Selected media'}
                                    className="h-48 w-full object-cover sm:h-56"
                                />
                            ) : (
                                <div className="flex h-48 w-full items-center justify-center bg-black/40 text-white/50 sm:h-56">
                                    <UploadCloud className="size-6" />
                                </div>
                            )}

                            <div className="absolute inset-0 flex flex-col justify-between p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-full bg-black/60 px-2 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/60 backdrop-blur">
                                        {item.status === 'uploading'
                                            ? `Uploading ${item.progress}%`
                                            : item.status === 'error'
                                                ? 'Failed'
                                                : 'Ready'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className={cn(
                                                'rounded-full bg-black/50 p-1 text-white/70 transition hover:bg-black/70 hover:text-amber-300',
                                                item.isPrimary && 'text-amber-300',
                                            )}
                                            onClick={() => setPrimary(item.clientId)}
                                            aria-pressed={item.isPrimary}
                                            aria-label={item.isPrimary ? 'Primary media' : 'Set as primary'}
                                        >
                                            <Star className="size-3.5" fill={item.isPrimary ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-full bg-black/50 p-1 text-white/70 transition hover:bg-black/70 hover:text-white"
                                            onClick={() => removeItem(item.clientId)}
                                            aria-label="Remove media"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'uploading' ? (
                                            <Loader2 className="size-3 animate-spin text-white/80" />
                                        ) : item.status === 'error' ? (
                                            <RefreshCw className="size-3 text-rose-300" />
                                        ) : null}
                                        <span className="truncate text-xs text-white/80">
                                            {item.file?.name ?? item.response?.mime_type ?? 'Media'}
                                        </span>
                                    </div>
                                    {item.progress > 0 && item.progress < 100 && (
                                        <span className="text-xs text-white/70">{item.progress}%</span>
                                    )}
                                </div>
                                {item.status === 'error' && item.error && (
                                    <p className="mt-2 text-xs text-rose-300">{item.error}</p>
                                )}
                                {item.status === 'error' && (
                                    <button
                                        type="button"
                                        onClick={() => retryUpload(item.clientId)}
                                        className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/30"
                                    >
                                        <RefreshCw className="size-3" />
                                        Retry upload
                                    </button>
                                )}
                                {item.status === 'uploading' && (
                                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-white/80 transition-[width]"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

