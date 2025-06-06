import { NextResponse } from "next/server";
import { PhotoService } from "../../lib/dynamodb";

// GET - Get all unique tags
export async function GET() {
    try {
        const tags = await PhotoService.getAllTags();
        return NextResponse.json({ tags });
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
} 