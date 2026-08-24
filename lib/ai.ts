import { GoogleGenAI, Type, Schema } from "@google/genai";
import { env } from "@/lib/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function withTimeout<T>(promise: Promise<T>, ms: number = 15000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export async function getPreVisitSummary(symptoms: string) {
  const fallback = {
    urgency: "Medium",
    chiefConcern: "Unable to automatically analyze symptoms.",
    suggestedQuestions: [
      "When did these symptoms begin?",
      "Have the symptoms become worse or changed recently?",
      "Are you experiencing any severe or unusual symptoms?"
    ],
    aiGenerated: false
  };

  try {
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are a decision-support summarizer for a general-practice doctor. Analyze the patient symptoms and respond ONLY with valid JSON. Do NOT diagnose the patient.

URGENCY CLASSIFICATION RULES:
1. Low urgency: Use Low when symptoms appear mild, stable, uncomplicated, and there are no obvious warning signs requiring urgent assessment. (e.g. mild runny nose, occasional sneezing, mild sore throat, mild uncomplicated cold symptoms, mild seasonal allergy symptoms, minor muscle discomfort)
2. Medium urgency: Use Medium when symptoms are persistent, worsening, moderately uncomfortable, or require timely GP assessment, but there are no obvious emergency warning signs. (e.g. persistent fever, persistent abdominal discomfort, worsening but non-severe headache, moderate pain, symptoms interfering with normal activities)
3. High urgency: Use High only when the symptom description contains potentially serious warning signs that warrant urgent medical assessment. (e.g. severe difficulty breathing, severe chest pain/pressure, fainting or severe confusion, signs of stroke, severe uncontrolled bleeding, sudden severe neurological symptoms, severe rapidly worsening symptoms)
Do NOT classify something as High simply because the patient has pain, headache, nausea, fatigue, or because the symptom has lasted several days. Base urgency strictly on the actual severity.

SUGGESTED QUESTIONS RULES:
Generate exactly 3 specific questions tailored to the patient's complaint. Do NOT use generic questions like 'How long has this been happening?' or 'Any other symptoms?'. Focus on specific details relevant to their exact symptoms.

Return exactly this JSON structure and absolutely nothing else (no markdown, no backticks, no explanations, no nested arrays):
{
  "urgency": "Low" | "Medium" | "High",
  "chiefConcern": "string",
  "suggestedQuestions": [
    "question 1",
    "question 2",
    "question 3"
  ]
}
Symptoms: ${symptoms}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: {
              type: Type.STRING
            },
            chiefConcern: {
              type: Type.STRING
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["urgency", "chiefConcern", "suggestedQuestions"]
        } as Schema
      }
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const parsed = JSON.parse(text);
    
    // Normalize urgency safely
    let normalizedUrgency = "Medium";
    const lower = (parsed.urgency || "").toLowerCase();
    if (lower.includes("low")) normalizedUrgency = "Low";
    else if (lower.includes("high")) normalizedUrgency = "High";
    
    // Normalize suggestedQuestions
    let questions = parsed.suggestedQuestions;
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
      } catch (e) {}
    }
    if (Array.isArray(questions) && questions.length > 0 && Array.isArray(questions[0])) {
      // Flatten nested array if LLM hallucinated one
      questions = questions[0];
    }
    
    if (Array.isArray(questions)) {
      questions = questions
        .filter((q: any) => typeof q === 'string' && q.trim().length > 0)
        .map((q: string) => q.replace(/^\d+[\.\)]\s*/, '').trim()); // Strip any preceding numbers like "1." if LLM added them
      
      if (questions.length > 3) questions = questions.slice(0, 3);
    }
    
    if (!Array.isArray(questions) || questions.length < 3) {
      questions = fallback.suggestedQuestions;
    }

    return {
      urgency: normalizedUrgency,
      chiefConcern: parsed.chiefConcern || "Symptoms reported",
      suggestedQuestions: questions,
      aiGenerated: true
    };
  } catch (e) {
    console.error("Pre-visit AI failed:", e);
    return fallback;
  }
}

export async function getPostVisitSummary(notes: string, prescription: string) {
  try {
    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Convert these clinical notes into a patient-friendly summary. Respond ONLY with valid JSON, no markdown:
{
  "summary": "string plain English max 150 words",
  "medicationSchedule": [{ "medicine": "string", "dose": "string", "frequency": "string" }],
  "followUpSteps": ["string", "string"]
}
Notes: ${notes}
Prescription: ${prescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            medicationSchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  medicine: { type: Type.STRING },
                  dose: { type: Type.STRING },
                  frequency: { type: Type.STRING }
                },
                required: ["medicine", "dose", "frequency"]
              }
            },
            followUpSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "medicationSchedule", "followUpSteps"]
        } as Schema
      }
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response");

    return JSON.parse(text);
  } catch (e) {
    console.error("Post-visit AI failed:", e);
    return { summary: null, medicationSchedule: [], followUpSteps: [] };
  }
}
