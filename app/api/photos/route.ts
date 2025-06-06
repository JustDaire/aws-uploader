import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PhotoService, Photo } from "../../lib/dynamodb";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// GET - List all photos
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tag = searchParams.get('tag');
        const limit = parseInt(searchParams.get('limit') || '50');
        const lastKey = searchParams.get('lastKey');

        let photos;
        if (tag) {
            photos = await PhotoService.searchPhotosByTag(tag);
            return NextResponse.json({ photos });
        } else {
            const result = await PhotoService.getAllPhotos(limit, lastKey ? JSON.parse(lastKey) : undefined);
            return NextResponse.json(result);
        }
    } catch (error) {
        console.error("Error fetching photos:", error);
        return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }
}

// POST - Upload a new photo
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const tags = JSON.parse(formData.get("tags") as string || "[]");
        const description = formData.get("description") as string || "";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type (only images)
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        const fileId = uuidv4();
        const fileExtension = file.name.split('.').pop();
        const s3Key = `photos/${fileId}.${fileExtension}`;

        // Upload to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(uploadCommand);

        // Create S3 URL
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // Save metadata to DynamoDB
        const photo: Photo = {
            id: fileId,
            filename: `${fileId}.${fileExtension}`,
            originalName: file.name,
            s3Key,
            s3Url,
            tags: Array.isArray(tags) ? tags : [],
            description,
            size: file.size,
            contentType: file.type,
            uploadedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await PhotoService.createPhoto(photo);

        return NextResponse.json({
            message: "Photo uploaded successfully",
            photo
        });
    } catch (error) {
        console.error("Error uploading photo:", error);
        return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
    }
} 