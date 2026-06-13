import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeBankStatement(content: string) {
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Analisis rekening koran berikut. Kembalikan JSON valid berisi total_credit, total_debit, dan transactions (date, description, amount, type income|expense, category, invoice_match). Jangan tambahkan markdown.\n\n${content}`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
