// API client for interacting with upload and download endpoints

export interface UploadResponse {
    success: boolean;
    message: string;
    fileName: string;
    etag?: string;
    url: string;
}

export interface ApiError {
    error: string;
    details?: string;
}

export interface S3Object {
    Key?: string;
    LastModified?: Date;
    ETag?: string;
    Size?: number;
    StorageClass?: string;
}

export interface ListFilesResponse {
    success: boolean;
    Contents: S3Object[];
    IsTruncated: boolean;
    NextContinuationToken?: string;
}

export interface DeleteFileResponse {
    success: boolean;
    message: string;
    fileName: string;
}

/**
 * Upload a file using the API endpoint
 */
export const uploadFileAPI = async (
    file: File,
    fileName?: string
): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (fileName) {
        formData.append('fileName', fileName);
    }

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
};

/**
 * Download a file using the API endpoint
 */
export const downloadFileAPI = async (fileName: string): Promise<Blob> => {
    const response = await fetch(`/api/download?fileName=${encodeURIComponent(fileName)}`);

    if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Download failed');
    }

    return response.blob();
};

/**
 * List files using the API endpoint
 */
export const listFilesAPI = async (pageSize: string = '100'): Promise<ListFilesResponse> => {
    const response = await fetch(`/api/files/list?pageSize=${encodeURIComponent(pageSize)}`);

    if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to list files');
    }

    return response.json();
};

/**
 * Delete a file using the API endpoint
 */
export const deleteFileAPI = async (fileName: string): Promise<DeleteFileResponse> => {
    const response = await fetch(`/api/files/delete?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
    }

    return response.json();
};

/**
 * Helper function to trigger file download in the browser
 */
export const downloadFile = async (fileName: string): Promise<void> => {
    try {
        const blob = await downloadFileAPI(fileName);

        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};

/**
 * Preview a file by opening it in a new tab
 */
export const previewFile = async (fileName: string): Promise<void> => {
    try {
        const previewUrl = `/api/preview?fileName=${encodeURIComponent(fileName)}`;
        window.open(previewUrl, '_blank');
    } catch (error) {
        console.error('Preview failed:', error);
        throw error;
    }
};

/**
 * Get preview URL for a file
 */
export const getPreviewUrl = (fileName: string): string => {
    return `/api/preview?fileName=${encodeURIComponent(fileName)}`;
};

/**
 * Upload multiple files sequentially
 */
export const uploadMultipleFiles = async (
    files: File[],
    onProgress?: (uploaded: number, total: number) => void
): Promise<UploadResponse[]> => {
    const results: UploadResponse[] = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await uploadFileAPI(files[i]);
            results.push(result);
            onProgress?.(i + 1, files.length);
        } catch (error) {
            console.error(`Failed to upload ${files[i].name}:`, error);
            // Continue with other files even if one fails
            results.push({
                success: false,
                message: error instanceof Error ? error.message : 'Upload failed',
                fileName: files[i].name,
                url: ''
            });
            onProgress?.(i + 1, files.length);
        }
    }

    return results;
}; 