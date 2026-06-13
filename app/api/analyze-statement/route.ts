import { analyzeBankStatement } from "@/lib/gemini";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    return NextResponse.json(await analyzeBankStatement(content));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menganalisis rekening koran" }, { status: 500 });
  }
}
