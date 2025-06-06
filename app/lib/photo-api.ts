import { Photo } from './dynamodb';

export interface PhotosResponse {
    photos: Photo[];
    lastEvaluatedKey?: any;
}

export class PhotoAPI {
    // Get all photos with optional filtering
    static async getPhotos(params: {
        tag?: string;
        limit?: number;
        lastKey?: string;
    } = {}): Promise<PhotosResponse> {
        const searchParams = new URLSearchParams();

        if (params.tag) searchParams.append('tag', params.tag);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.lastKey) searchParams.append('lastKey', params.lastKey);

        const response = await fetch(`/api/photos?${searchParams}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch photos: ${response.statusText}`);
        }

        return response.json();
    }

    // Get a specific photo by ID
    static async getPhoto(id: string): Promise<Photo> {
        const response = await fetch(`/api/photos/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch photo: ${response.statusText}`);
        }

        const data = await response.json();
        return data.photo;
    }

    // Upload a new photo
    static async uploadPhoto(file: File, tags: string[], description?: string): Promise<Photo> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tags', JSON.stringify(tags));
        if (description) {
            formData.append('description', description);
        }

        const response = await fetch('/api/photos', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload photo');
        }

        const data = await response.json();
        return data.photo;
    }

    // Update photo metadata
    static async updatePhoto(id: string, updates: {
        tags?: string[];
        description?: string;
    }): Promise<Photo> {
        const response = await fetch(`/api/photos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error(`Failed to update photo: ${response.statusText}`);
        }

        const data = await response.json();
        return data.photo;
    }

    // Delete a photo
    static async deletePhoto(id: string): Promise<void> {
        const response = await fetch(`/api/photos/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete photo: ${response.statusText}`);
        }
    }

    // Get all tags
    static async getTags(): Promise<string[]> {
        const response = await fetch('/api/tags');
        if (!response.ok) {
            throw new Error(`Failed to fetch tags: ${response.statusText}`);
        }

        const data = await response.json();
        return data.tags;
    }
} 