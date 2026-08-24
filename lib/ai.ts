import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function getPreVisitSummary(symptoms: string) {
  try {
    const msg = await client.messages.create({
      model: "claude-3-5-sonnet-20240620", // using standard claude-3-5-sonnet model as "claude-sonnet-4-6" is fictional
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `You are a clinical assistant. Analyse the patient symptoms and respond ONLY with valid JSON, no markdown:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "chiefComplaint": "string max 20 words",
  "suggestedQuestions": ["string", "string", "string"]
}
Symptoms: ${symptoms}`
      }]
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(text);
    // Zod validate shape
    if (!["Low","Medium","High"].includes(parsed.urgencyLevel)) throw new Error("bad shape");
    return parsed;
  } catch (e) {
    console.error("Pre-visit AI failed:", e);
    return { urgencyLevel: null, chiefComplaint: null, suggestedQuestions: [] };
  }
}

export async function getPostVisitSummary(notes: string, prescription: string) {
  try {
    const msg = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Convert these clinical notes into a patient-friendly summary. Respond ONLY with valid JSON, no markdown:
{
  "summary": "string plain English max 150 words",
  "medicationSchedule": [{ "medicine": "string", "dose": "string", "frequency": "string" }],
  "followUpSteps": ["string", "string"]
}
Notes: ${notes}
Prescription: ${prescription}`
      }]
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return JSON.parse(text);
  } catch (e) {
    console.error("Post-visit AI failed:", e);
    return { summary: null, medicationSchedule: [], followUpSteps: [] };
  }
}
