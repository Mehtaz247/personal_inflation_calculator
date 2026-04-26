import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy",
});

const responseSchema = z.object({
  food: z.number().optional(),
  eating_out: z.number().optional(),
  housing: z.number().optional(),
  transport: z.number().optional(),
  communication: z.number().optional(),
  healthcare: z.number().optional(),
  education: z.number().optional(),
  clothing: z.number().optional(),
  household_personal: z.number().optional(),
  entertainment: z.number().optional(),
  tobacco_alcohol: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in environment." },
        { status: 500 }
      );
    }

    const body = await req.json();
    if (!body.text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const prompt = `You are a financial parsing assistant for an Indian Personal Inflation Calculator.
Extract the monthly spending amounts (in INR) from the following text and map them to the appropriate categories.
Return ONLY valid JSON matching the schema.

Categories:
- food: Groceries, vegetables, dairy, beverages cooked at home
- eating_out: Restaurants, cafes, food delivery, hotels
- housing: Rent (incl. imputed rent if owned), water, electricity, cooking gas
- transport: Vehicle fuel (petrol/diesel), public transport, taxi, vehicle upkeep
- communication: Mobile, broadband, internet, postal
- healthcare: Medicines, doctor fees, hospitals, insurance
- education: School/college fees, books, tuitions
- clothing: Apparel, footwear, tailoring
- household_personal: Furnishings, toiletries, grooming
- entertainment: Movies, OTT, sports, hobbies, events
- tobacco_alcohol: Paan, tobacco, intoxicants

If a category is not mentioned, omit it or set it to 0. Only output the JSON object.

Text to parse:
"""
${body.text}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const parsed = responseSchema.parse(JSON.parse(text));
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse text" }, { status: 500 });
  }
}
