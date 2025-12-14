import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client - credentials should be server-side only
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
    },
    region: process.env.S3_REGION || 'eu-west-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'daire-photo';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileName = formData.get('fileName') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Use provided fileName or fall back to original name
        const key = fileName || file.name;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
            ACL: 'public-read', // Adjust based on your security requirements
        });

        const response = await s3Client.send(command);

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            fileName: key,
            etag: response.ETag,
            url: `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || 'eu-west-1'}.amazonaws.com/${key}`
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            {
                error: 'Upload failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
} 