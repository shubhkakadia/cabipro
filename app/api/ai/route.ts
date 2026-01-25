import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const employees = await prisma.employees.findMany({});
  const inventory = await prisma.item.findMany({
    include: {
      sheet: true,
      handle: true,
      hardware: true,
      accessory: true,
    },
  });

  const systemPrompt = `
You are a business analyst for a cabinet-making ERP.
Only use the data provided.
Do not guess or hallucinate.
Return clear bullet points.

Employees: ${JSON.stringify(employees)}
Inventory: ${JSON.stringify(inventory)}
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: `${systemPrompt}\n\nUser: ${prompt}`,
      stream: false,
    }),
  });

  const data = await response.json();

  return NextResponse.json({
    answer: data.response,
  });
}
