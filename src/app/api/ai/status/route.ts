import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const defaultMode = hasServerKey ? "gemini" : (process.env.EVALUATOR_MODE || "mock");

  return NextResponse.json({
    success: true,
    hasServerKey,
    model,
    defaultMode,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = (body.apiKey || process.env.GEMINI_API_KEY || "").trim();
    const model = body.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "No Gemini API Key provided. Enter a key or set GEMINI_API_KEY in your environment.",
        },
        { status: 400 }
      );
    }

    // Ping Google Gemini REST API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Ping. Respond with the exact word: PONG." },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      let message = `Gemini API returned HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          message = errJson.error.message;
        }
      } catch {
        // use default message
      }
      return NextResponse.json({ success: false, error: message }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Connected";

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${model}! Response: "${reply}"`,
      model,
    });
  } catch (err: any) {
    console.error("POST /api/ai/status error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.name === "TimeoutError" ? "Gemini API request timed out (15s limit)" : err.message,
      },
      { status: 500 }
    );
  }
}
