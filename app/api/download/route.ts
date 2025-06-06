import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client - credentials should be server-side only
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    region: process.env.S3_REGION || 'eu-west-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'daire-photo';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');

        if (!fileName) {
            return NextResponse.json(
                { error: 'fileName parameter is required' },
                { status: 400 }
            );
        }

        // First, get object metadata to check if it exists and get content type
        const headCommand = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });

        let contentType = 'application/octet-stream';
        let contentLength = 0;

        try {
            const headResponse = await s3Client.send(headCommand);
            contentType = headResponse.ContentType || 'application/octet-stream';
            contentLength = headResponse.ContentLength || 0;
        } catch (headError) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Get the object from S3
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return NextResponse.json(
                { error: 'File not found or empty' },
                { status: 404 }
            );
        }

        // Convert the stream to a buffer
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);

        // Return the file with appropriate headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': buffer.length.toString(),
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            {
                error: 'Download failed',
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
} 