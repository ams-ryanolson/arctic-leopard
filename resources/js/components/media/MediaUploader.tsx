import { uploadFile, type UploadError } from '@/lib/media-upload-client';
import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState } from 'react';

export type MediaUploaderProps = {
    accept?: string;
    maxFiles?: number;
    multiple?: boolean;
    onUploadComplete: (identifiers: string[]) => void;
    onError?: (error: string) => void;
    onProgress?: (fileIndex: number, percent: number) => void;
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
    className?: string;
    label?: string;
    children?: React.ReactNode;
};

type UploadItem = {
    file: File;
    progress: number;
    identifier: string | null;
    error: string | null;
    uploading: boolean;
};

export default function MediaUploader({
    accept,
    maxFiles = 1,
    multiple = false,
    onUploadComplete,
    onError,
    onProgress,
    onFileSelect,
    disabled = false,
    className,
    label,
    children,
}: MediaUploaderProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [, setUploadItems] = useState<UploadItem[]>([]);

    const handleFileSelect = useCallback(
        async (fileList: FileList | null) => {
            if (!fileList || fileList.length === 0) {
                return;
            }

            const fileArray = Array.from(fileList);
            const validFiles = fileArray.slice(0, maxFiles);

            if (validFiles.length === 0) {
                onError?.('Maximum file limit reached.');
                return;
            }

            // Notify parent of file selection for preview
            if (onFileSelect && validFiles[0]) {
                onFileSelect(validFiles[0]);
            }

            // Initialize upload items
            const items: UploadItem[] = validFiles.map((file) => ({
                file,
                progress: 0,
                identifier: null,
                error: null,
                uploading: true,
            }));

            setUploadItems(items);

            const identifiers: string[] = [];

            // Upload each file
            for (let i = 0; i < items.length; i++) {
                const file = items[i].file;

                try {
                    const response = await uploadFile(file, (percent) => {
                        setUploadItems((prev) => {
                            const next = [...prev];
                            if (next[i]) {
                                next[i] = { ...next[i], progress: percent };
                            }
                            return next;
                        });
                        onProgress?.(i, percent);
                    });

                    identifiers.push(response.identifier);

                    setUploadItems((prev) => {
                        const next = [...prev];
                        if (next[i]) {
                            next[i] = {
                                ...next[i],
                                identifier: response.identifier,
                                uploading: false,
                                progress: 100,
                            };
                        }
                        return next;
                    });
                } catch (error) {
                    const uploadError = error as UploadError;
                    const errorMessage =
                        uploadError.message ||
                        'Upload failed. Please try again.';

                    setUploadItems((prev) => {
                        const next = [...prev];
                        if (next[i]) {
                            next[i] = {
                                ...next[i],
                                error: errorMessage,
                                uploading: false,
                                progress: 0,
                            };
                        }
                        return next;
                    });

                    onError?.(errorMessage);
                }
            }

            if (identifiers.length > 0) {
                onUploadComplete(identifiers);
            }

            // Reset input
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [maxFiles, onUploadComplete, onError, onProgress, onFileSelect],
    );

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            handleFileSelect(event.target.files);
        },
        [handleFileSelect],
    );

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);

            if (disabled) {
                return;
            }

            handleFileSelect(event.dataTransfer.files);
        },
        [disabled, handleFileSelect],
    );

    const handleDragOver = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();

            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled],
    );

    const handleDragLeave = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
        },
        [],
    );

    const handleClick = useCallback(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    }, [disabled]);

    // Clone children and inject onClick to trigger file input
    const triggerFileInput = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && inputRef.current) {
                inputRef.current.click();
            }
        },
        [disabled],
    );

    return (
        <div
            className={cn('relative', className)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple && maxFiles > 1}
                onChange={handleInputChange}
                disabled={disabled}
                className="hidden"
            />

            {children ? (
                React.isValidElement(children) ? (
                    React.cloneElement(
                        children as React.ReactElement<{
                            onClick?: React.MouseEventHandler;
                        }>,
                        {
                            onClick: triggerFileInput,
                        },
                    )
                ) : (
                    <div onClick={triggerFileInput} className="cursor-pointer">
                        {children}
                    </div>
                )
            ) : (
                <div
                    onClick={triggerFileInput}
                    className={cn(
                        'flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
                        isDragging
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                        disabled && 'cursor-not-allowed opacity-50',
                    )}
                >
                    <div className="text-center">
                        <p className="text-sm font-medium">
                            {label || 'Click to upload or drag and drop'}
                        </p>
                        {accept && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Accepted: {accept}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
