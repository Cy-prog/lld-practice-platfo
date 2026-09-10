import { NextRequest, NextResponse } from "next/server";
import { evaluationService } from "@/application/container";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comparison = await evaluationService.getAttemptComparison(params.id);
    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (err: any) {
    console.error(`GET /api/attempts/${params.id}/comparison error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate comparison" },
      { status: 500 }
    );
  }
}
