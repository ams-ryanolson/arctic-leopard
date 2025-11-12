import type {
    FilePondErrorDescription,
    FilePondFile,
    FilePondInitialFile,
    FilePondServerConfigProps,
} from 'filepond';
import { FilePond, registerPlugin } from 'react-filepond';
import type { FilePondProps } from 'react-filepond';
import { forwardRef, useMemo, type CSSProperties } from 'react';

import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

import { cn } from '@/lib/utils';
import { getCsrfToken } from '@/lib/csrf';

import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

let pluginsRegistered = false;

if (typeof window !== 'undefined' && !pluginsRegistered) {
    registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginImageExifOrientation,
        FilePondPluginFileValidateType,
    );
    pluginsRegistered = true;
}

type ServerConfig = Required<FilePondProps>['server'];

export type FilePondUploaderProps = {
    name: string;
    labelIdle?: string;
    className?: string;
    style?: CSSProperties;
    server?: ServerConfig;
    files?: FilePondInitialFile[];
    acceptedFileTypes?: string[];
    maxFiles?: number;
    allowMultiple?: boolean;
    instantUpload?: boolean;
    onProcess?: (file: FilePondFile) => void;
    onRemove?: (file: FilePondFile) => void;
    onError?: (error: FilePondErrorDescription, file?: FilePondFile) => void;
} & Omit<FilePondProps, 'name' | 'server' | 'files' | 'allowFileTypeValidation' | 'acceptedFileTypes'>;

function buildDefaultServer(): ServerConfig {
    const headers: Record<string, string> = {
        'X-Requested-With': 'XMLHttpRequest',
    };

    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
    }

    return {
        process: (fieldName, file, metadata, load, error, progress, abort) => {
            const formData = new FormData();
            formData.append('file', file, file.name);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/uploads/tmp');

            Object.entries(headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });

            xhr.withCredentials = true;

            xhr.upload.onprogress = (e) => {
                progress(e.lengthComputable, e.loaded, e.total);
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const payload = JSON.parse(xhr.responseText);
                        if (typeof payload === 'object' && payload !== null && 'id' in payload) {
                            const identifier = payload.id as string;
                            payload.thumbnail_path =
                                (payload as Record<string, unknown>)?.thumbnail_path ??
                                `/uploads/tmp/${identifier}`;
                            payload.path = payload.path ?? `/uploads/tmp/${identifier}`;
                            payload.url = payload.url ?? `/uploads/tmp/${identifier}`;
                            payload.thumbnail_url =
                                (payload as Record<string, unknown>)?.thumbnail_url ??
                                payload.url ??
                                `/uploads/tmp/${identifier}`;
                            if (metadata && typeof metadata === 'object') {
                                (metadata as Record<string, unknown>).uploadPayload = payload;
                            }
                            const setMetadata = (file as unknown as { setMetadata?: (key: string, value: unknown, silent?: boolean) => void }).setMetadata;
                            if (file && typeof setMetadata === 'function') {
                                setMetadata('uploadPayload', payload, true);
                                setMetadata('upload', payload, true);
                            }
                            load(String(payload.id));
                            return;
                        }
                    } catch {
                        // ignore
                    }
                    error('Upload failed. Please try again.');
                } else {
                    try {
                        const payload = JSON.parse(xhr.responseText);
                        if (typeof payload === 'object' && payload !== null) {
                            const errorMessage = (payload.errors && Object.values(payload.errors).flat().join(' ')) ||
                                payload.message ||
                                'Upload failed. Please try again.';
                            
                            console.error('Upload validation error:', payload);
                            error(errorMessage);
                            return;
                        }
                    } catch (e) {
                        console.error('Upload error (parse failed):', xhr.responseText, e);
                    }
                    error('Upload failed. Please try again.');
                }
            };

            xhr.onerror = () => {
                error('Upload failed. Please try again.');
            };

            xhr.send(formData);

            return {
                abort: () => {
                    xhr.abort();
                    abort();
                },
            };
        },
        revert: {
            url: '/uploads/tmp',
            method: 'DELETE',
            withCredentials: true,
            headers,
        },
        load: (source, load, error, progress, abort) => {
            const controller = new AbortController();

            fetch(`/uploads/tmp/${encodeURIComponent(source)}`, {
                signal: controller.signal,
                credentials: 'include',
            })
                .then(async (response) => {
                    if (!response.ok) {
                        error('Unable to load file');
                        abort();
                        return;
                    }

                    const blob = await response.blob();
                    load(blob);
                })
                .catch(() => {
                    error('Unable to load file');
                    abort();
                });

            return {
                abort: () => {
                    controller.abort();
                    abort();
                },
            };
        },
        fetch: null,
    } satisfies FilePondServerConfigProps;
}

const FilePondUploader = forwardRef<FilePond, FilePondUploaderProps>(function FilePondUploader(
{
    name,
    labelIdle,
    className,
    style,
    server,
    files,
    acceptedFileTypes,
    maxFiles,
    allowMultiple,
    instantUpload = true,
    onProcess,
    onRemove,
    onError,
    ...props
}: FilePondUploaderProps,
ref,
) {
    const resolvedServer = useMemo(() => server ?? buildDefaultServer(), [server]);

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className={cn('filepond-wrapper', className)} style={style}>
            <FilePond
                ref={ref}
                name={name}
                files={files}
                allowMultiple={allowMultiple}
                maxFiles={maxFiles}
                acceptedFileTypes={acceptedFileTypes}
                instantUpload={instantUpload}
                labelIdle={
                    labelIdle ??
                    'Drag & Drop or <span class="filepond--label-action">Browse</span>'
                }
                server={resolvedServer}
                credits={false}
                onprocessfile={(_, file) => onProcess?.(file)}
                onremovefile={(_, file) => onRemove?.(file)}
                onerror={(error, file) => onError?.(error, file)}
                {...props}
            />
        </div>
    );
});

export default FilePondUploader;


