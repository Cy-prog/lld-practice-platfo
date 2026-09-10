import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@/application/container";

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
    return NextResponse.json({ success: true, data: attempt });
  } catch (err: any) {
    console.error(`GET /api/attempts/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve attempt" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content payload is required for updating draft." },
        { status: 400 }
      );
    }

    const updated = await attemptService.updateDraft(params.id, content);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error(`PATCH /api/attempts/${params.id} error:`, err);
    const isDomain = err.name === "DomainError" || err.name === "InvalidStateTransitionError";
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update draft" },
      { status: isDomain ? 400 : 500 }
    );
  }
}
