import { useCallback, useState } from 'react';
import { uploadFile, type UploadError, type UploadResponse } from '@/lib/media-upload-client';

export type UploadState = {
    uploading: boolean;
    progress: number;
    error: string | null;
    identifier: string | null;
};

export type UseMediaUploadReturn = {
    upload: (file: File) => Promise<string | null>;
    uploading: boolean;
    progress: number;
    error: string | null;
    identifier: string | null;
    reset: () => void;
};

/**
 * Hook for handling media file uploads
 *
 * @returns Upload functions and state
 */
export function useMediaUpload(): UseMediaUploadReturn {
    const [state, setState] = useState<UploadState>({
        uploading: false,
        progress: 0,
        error: null,
        identifier: null,
    });

    const upload = useCallback(async (file: File): Promise<string | null> => {
        setState({
            uploading: true,
            progress: 0,
            error: null,
            identifier: null,
        });

        try {
            const response = await uploadFile(file, (percent) => {
                setState((prev) => ({
                    ...prev,
                    progress: percent,
                }));
            });

            setState({
                uploading: false,
                progress: 100,
                error: null,
                identifier: response.identifier,
            });

            return response.identifier;
        } catch (error) {
            const uploadError = error as UploadError;
            const errorMessage =
                uploadError.message ||
                'Upload failed. Please try again.';

            setState({
                uploading: false,
                progress: 0,
                error: errorMessage,
                identifier: null,
            });

            console.error('[useMediaUpload] Upload failed', {
                error: uploadError,
                file: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                },
            });

            return null;
        }
    }, []);

    const reset = useCallback(() => {
        setState({
            uploading: false,
            progress: 0,
            error: null,
            identifier: null,
        });
    }, []);

    return {
        upload,
        uploading: state.uploading,
        progress: state.progress,
        error: state.error,
        identifier: state.identifier,
        reset,
    };
}

