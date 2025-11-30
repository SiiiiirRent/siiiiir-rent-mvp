import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  const keyPreview = process.env.RESEND_API_KEY
    ? process.env.RESEND_API_KEY.substring(0, 10) + "..."
    : "undefined";

  return NextResponse.json({
    hasKey,
    keyPreview,
    allEnvKeys: Object.keys(process.env).filter((k) => k.includes("RESEND")),
  });
}
