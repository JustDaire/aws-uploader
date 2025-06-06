import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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
        const pageSize = searchParams.get('pageSize') || '100';

        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            MaxKeys: Number(pageSize),
        });

        const response = await s3Client.send(command);

        return NextResponse.json({
            success: true,
            Contents: response.Contents || [],
            IsTruncated: response.IsTruncated || false,
            NextContinuationToken: response.NextContinuationToken
        });

    } catch (error) {
        console.error('List files error:', error);
        return NextResponse.json(
            {
                error: 'Failed to list files',
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