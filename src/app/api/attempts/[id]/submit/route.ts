import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@/application/container";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional if submitting already saved draft
    }

    const { content } = body;
    const result = await attemptService.submitAttempt(params.id, content);

    if (!result.validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Deterministic validation failed. Correct the errors below before submitting.",
          validation: result.validation,
          attempt: result.attempt,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        attempt: result.attempt,
        validation: result.validation,
      },
    });
  } catch (err: any) {
    console.error(`POST /api/attempts/${params.id}/submit error:`, err);
    const isDomain = err.name === "DomainError" || err.name === "InvalidStateTransitionError";
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit attempt" },
      { status: isDomain ? 400 : 500 }
    );
  }
}
