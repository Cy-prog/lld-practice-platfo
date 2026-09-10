import { NextRequest, NextResponse } from "next/server";
import { evaluationService, attemptService } from "@/application/container";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attempt = await attemptService.getAttemptById(params.id);
    if (!attempt) {
      return NextResponse.json(
        { success: false, error: `Attempt '${params.id}' not found.` },
        { status: 404 }
      );
    }

    const evaluation = await evaluationService.getEvaluationForAttempt(params.id);
    return NextResponse.json({
      success: true,
      data: {
        attemptStatus: attempt.status,
        errorMessage: attempt.errorMessage,
        evaluation,
      },
    });
  } catch (err: any) {
    console.error(`GET /api/attempts/${params.id}/evaluate error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch evaluation status" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Optional body
    }

    const { mode, apiKey } = body;
    const headerKey = req.headers.get("x-gemini-api-key");
    const activeApiKey = apiKey || headerKey || undefined;
    const evaluation = await evaluationService.evaluateAttempt(params.id, mode, activeApiKey);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (err: any) {
    console.error(`POST /api/attempts/${params.id}/evaluate error:`, err);
    const isDomain = err.name === "DomainError" || err.name === "InvalidStateTransitionError";
    return NextResponse.json(
      { success: false, error: err.message || "Evaluation failed" },
      { status: isDomain ? 400 : 500 }
    );
  }
}
