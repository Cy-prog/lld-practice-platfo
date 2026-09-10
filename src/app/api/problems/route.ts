import { NextResponse } from "next/server";
import { problemService } from "@/application/container";

export async function GET() {
  try {
    const problems = await problemService.getAllProblems();
    return NextResponse.json({ success: true, data: problems });
  } catch (err: any) {
    console.error("GET /api/problems error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load problems" },
      { status: 500 }
    );
  }
}
