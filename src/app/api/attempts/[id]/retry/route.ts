import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@/application/container";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const newAttempt = await attemptService.retryAttempt(params.id);
    return NextResponse.json({
      success: true,
      data: newAttempt,
    });
  } catch (err: any) {
    console.error(`POST /api/attempts/${params.id}/retry error:`, err);
    const isDomain = err.name === "DomainError" || err.name === "InvalidStateTransitionError";
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retry attempt" },
      { status: isDomain ? 400 : 500 }
    );
  }
}
