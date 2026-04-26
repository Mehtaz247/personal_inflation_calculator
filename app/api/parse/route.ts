import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy",
});

const SECTOR_VALUES = ["combined", "urban", "rural"] as const;

const STATE_NAMES = [
  "All India",
  "Andaman And Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu And Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "NCT of Delhi",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "The Dadra And Nagar Haveli And Daman And Diu",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

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
  state: z.enum(STATE_NAMES).optional(),
  sector: z.enum(SECTOR_VALUES).optional(),
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
Also infer location and area type when the user mentions them.
Return ONLY valid JSON matching the schema.

Spending categories (all amounts in INR per month):
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

Location:
- state: Map any city or state mentioned to its Indian state/UT name. Use one of:
  ${STATE_NAMES.join(", ")}.
  Examples: "Bangalore" or "Bengaluru" → "Karnataka"; "Mumbai" or "Pune" → "Maharashtra";
  "Delhi" or "Gurgaon-side Delhi NCR" → "NCT of Delhi"; "Hyderabad" → "Telangana";
  "Chennai" → "Tamil Nadu"; "Ahmedabad" or "Surat" → "Gujarat".
  Omit if no location is mentioned.
- sector: One of "urban", "rural", or "combined".
  Use "urban" for any city or town. Use "rural" only if the user explicitly mentions
  a village or rural setting. Use "combined" if the user mentions a state without
  specifying a city/village, or if the situation is genuinely mixed (e.g. "we split
  time between our farm and our flat in the city"). Otherwise omit.

If a spending category is not mentioned, omit it or set it to 0. Only output the JSON object.

Text to parse:
"""
${body.text}
"""
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview",
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
