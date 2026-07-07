import { NextResponse } from "next/server";

type TaskEmailPayload = {
  to?: string;
  subject?: string;
  message?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as TaskEmailPayload;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.TASK_EMAIL_FROM;

  if (!payload.to || !payload.subject || !payload.message) {
    return NextResponse.json({ sent: false, error: "Payload email belum lengkap." }, { status: 400 });
  }

  if (!apiKey || !from) {
    return NextResponse.json({ sent: false, error: "Email provider belum dikonfigurasi." });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.message,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ sent: false, error: detail || "Email gagal dikirim." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
