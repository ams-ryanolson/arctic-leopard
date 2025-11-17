import { getCsrfToken } from './csrf';

export type UploadResponse = {
    id: string;
    identifier: string;
    filename: string;
    path: string;
    original_name: string;
    mime_type: string;
    size: number;
    disk: string;
    url: string;
    thumbnail_url: string;
};

export type UploadError = {
    message: string;
    errors?: Record<string, string[]>;
};

/**
 * Upload a file to the temporary upload endpoint
 *
 * @param file - The file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise resolving to the upload response with identifier
 * @throws UploadError if upload fails
 */
export async function uploadFile(
    file: File,
    onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Get CSRF token (meta tag first, then cookie)
    const csrfToken =
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        getCsrfToken();

    if (!csrfToken) {
        throw new Error('CSRF token not found. Please refresh the page and try again.');
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', '/uploads/tmp');
        xhr.withCredentials = true;
        xhr.responseType = 'json';

        // Set headers
        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
        xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // Track upload progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        // Handle successful response
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const payload =
                    xhr.response ??
                    (() => {
                        try {
                            return JSON.parse(xhr.responseText);
                        } catch {
                            return null;
                        }
                    })();

                if (payload && typeof payload === 'object' && 'id' in payload) {
                    resolve({
                        id: payload.id || payload.identifier || '',
                        identifier: payload.id || payload.identifier || '',
                        filename: payload.filename || file.name,
                        path: payload.path || '',
                        original_name: payload.original_name || file.name,
                        mime_type: payload.mime_type || file.type,
                        size: payload.size || file.size,
                        disk: payload.disk || '',
                        url: payload.url || '',
                        thumbnail_url: payload.thumbnail_url || payload.url || '',
                    });
                    return;
                }

                reject({
                    message: 'Upload succeeded but response was malformed.',
                    errors: {},
                });
                return;
            }

            // Handle error response
            const errorPayload = (() => {
                try {
                    return JSON.parse(xhr.responseText);
                } catch {
                    return null;
                }
            })();

            const message =
                errorPayload?.message ??
                (errorPayload?.errors
                    ? Object.values(errorPayload.errors).flat().join(' ')
                    : null) ??
                `Upload failed with status ${xhr.status}`;

            reject({
                message,
                errors: errorPayload?.errors || {},
            });
        };

        // Handle network errors
        xhr.onerror = () => {
            reject({
                message: 'Network error. Please check your connection and try again.',
                errors: {},
            });
        };

        // Handle abort
        xhr.onabort = () => {
            reject({
                message: 'Upload cancelled.',
                errors: {},
            });
        };

        // Send the request
        xhr.send(formData);
    });
}

