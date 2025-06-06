import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// DynamoDB configuration
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const dynamoClient = DynamoDBDocumentClient.from(client);

// Table name
export const PHOTO_TABLE = process.env.DYNAMODB_PHOTO_TABLE || "photo-gallery";

// Photo interface
export interface Photo {
    id: string;
    filename: string;
    originalName: string;
    s3Key: string;
    s3Url: string;
    tags: string[];
    description?: string;
    size: number;
    contentType: string;
    uploadedAt: string;
    updatedAt: string;
}

// DynamoDB operations
export class PhotoService {
    // Create a new photo record
    static async createPhoto(photo: Photo): Promise<void> {
        const command = new PutCommand({
            TableName: PHOTO_TABLE,
            Item: photo,
        });
        await dynamoClient.send(command);
    }

    // Get a photo by ID
    static async getPhoto(id: string): Promise<Photo | null> {
        const command = new GetCommand({
            TableName: PHOTO_TABLE,
            Key: { id },
        });
        const result = await dynamoClient.send(command);
        return result.Item as Photo || null;
    }

    // Get all photos (with pagination)
    static async getAllPhotos(limit: number = 50, lastEvaluatedKey?: any): Promise<{
        photos: Photo[];
        lastEvaluatedKey?: any;
    }> {
        const command = new ScanCommand({
            TableName: PHOTO_TABLE,
            Limit: limit,
            ExclusiveStartKey: lastEvaluatedKey,
        });
        const result = await dynamoClient.send(command);
        return {
            photos: result.Items as Photo[] || [],
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    }

    // Search photos by tags
    static async searchPhotosByTag(tag: string): Promise<Photo[]> {
        const command = new ScanCommand({
            TableName: PHOTO_TABLE,
            FilterExpression: "contains(tags, :tag)",
            ExpressionAttributeValues: {
                ":tag": tag,
            },
        });
        const result = await dynamoClient.send(command);
        return result.Items as Photo[] || [];
    }

    // Update photo metadata (tags, description)
    static async updatePhoto(id: string, updates: Partial<Pick<Photo, 'tags' | 'description'>>): Promise<void> {
        const updateExpression: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        if (updates.tags) {
            updateExpression.push("#tags = :tags");
            expressionAttributeNames["#tags"] = "tags";
            expressionAttributeValues[":tags"] = updates.tags;
        }

        if (updates.description !== undefined) {
            updateExpression.push("#description = :description");
            expressionAttributeNames["#description"] = "description";
            expressionAttributeValues[":description"] = updates.description;
        }

        // Always update the updatedAt timestamp
        updateExpression.push("#updatedAt = :updatedAt");
        expressionAttributeNames["#updatedAt"] = "updatedAt";
        expressionAttributeValues[":updatedAt"] = new Date().toISOString();

        const command = new UpdateCommand({
            TableName: PHOTO_TABLE,
            Key: { id },
            UpdateExpression: "SET " + updateExpression.join(", "),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        });

        await dynamoClient.send(command);
    }

    // Delete a photo record
    static async deletePhoto(id: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: PHOTO_TABLE,
            Key: { id },
        });
        await dynamoClient.send(command);
    }

    // Get all unique tags
    static async getAllTags(): Promise<string[]> {
        const command = new ScanCommand({
            TableName: PHOTO_TABLE,
            ProjectionExpression: "tags",
        });
        const result = await dynamoClient.send(command);

        const allTags = new Set<string>();
        result.Items?.forEach((item: any) => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach((tag: string) => allTags.add(tag));
            }
        });

        return Array.from(allTags).sort();
    }
} 