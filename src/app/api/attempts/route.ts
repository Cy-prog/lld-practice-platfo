import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@/application/container";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId") || undefined;
    const attempts = await attemptService.getAttempts(problemId);
    return NextResponse.json({ success: true, data: attempts });
  } catch (err: any) {
    console.error("GET /api/attempts error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load attempts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemId } = body;

    if (!problemId) {
      return NextResponse.json(
        { success: false, error: "problemId is required to start an attempt." },
        { status: 400 }
      );
    }

    const newAttempt = await attemptService.startAttempt(problemId);
    return NextResponse.json({ success: true, data: newAttempt }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/attempts error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to start attempt" },
      { status: err.name === "DomainError" ? 400 : 500 }
    );
  }
}
