import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client - credentials should be server-side only
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    region: process.env.S3_REGION || 'eu-west-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'daire-photo';

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');

        if (!fileName) {
            return NextResponse.json(
                { error: 'fileName parameter is required' },
                { status: 400 }
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });

        const response = await s3Client.send(command);

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
            fileName: fileName,
            response: response
        });

    } catch (error) {
        console.error('Delete file error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete file',
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
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
} 