import { NextRequest, NextResponse } from "next/server";
import { problemService } from "@/application/container";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const problem = await problemService.getProblemById(params.id);
    if (!problem) {
      return NextResponse.json(
        { success: false, error: `Problem '${params.id}' not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: problem });
  } catch (err: any) {
    console.error(`GET /api/problems/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
