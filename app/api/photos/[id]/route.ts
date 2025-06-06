import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PhotoService } from "../../../lib/dynamodb";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// GET - Get a specific photo by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const photo = await PhotoService.getPhoto(params.id);

        if (!photo) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        return NextResponse.json({ photo });
    } catch (error) {
        console.error("Error fetching photo:", error);
        return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
    }
}

// PUT - Update photo metadata (tags, description)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { tags, description } = body;

        // Validate that the photo exists
        const existingPhoto = await PhotoService.getPhoto(params.id);
        if (!existingPhoto) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        // Update the photo metadata
        await PhotoService.updatePhoto(params.id, { tags, description });

        // Get the updated photo
        const updatedPhoto = await PhotoService.getPhoto(params.id);

        return NextResponse.json({
            message: "Photo updated successfully",
            photo: updatedPhoto
        });
    } catch (error) {
        console.error("Error updating photo:", error);
        return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
    }
}

// DELETE - Delete a photo
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get the photo first to get the S3 key
        const photo = await PhotoService.getPhoto(params.id);

        if (!photo) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        // Delete from S3
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: photo.s3Key,
        });
        await s3Client.send(deleteCommand);

        // Delete from DynamoDB
        await PhotoService.deletePhoto(params.id);

        return NextResponse.json({ message: "Photo deleted successfully" });
    } catch (error) {
        console.error("Error deleting photo:", error);
        return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }
} 