import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function suggestRelationships(noteTitle: string, noteContent: string, existingNotes: { id: string, title: string }[]) {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    Given the following note:
    Title: ${noteTitle}
    Content: ${noteContent}

    And the following existing notes in the knowledge base:
    ${existingNotes.map(n => `- ${n.title} (ID: ${n.id})`).join('\n')}

    Suggest potential relationships between the new note and existing notes.
    Return a JSON array of objects with:
    - targetNoteId: string
    - relationType: "depends_on" | "related_to" | "example_of" | "part_of" | "custom"
    - description: string
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              targetNoteId: { type: Type.STRING },
              relationType: { type: Type.STRING, enum: ["depends_on", "related_to", "example_of", "part_of", "custom"] },
              description: { type: Type.STRING }
            },
            required: ["targetNoteId", "relationType", "description"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini error:", error);
    return [];
  }
}

export async function autoGraphKnowledgeBase(notes: { id: string, title: string, content: string }[]) {
  if (!process.env.GEMINI_API_KEY || notes.length < 2) return [];

  const prompt = `
    Analyze the following knowledge base and suggest a comprehensive set of relationships to form a knowledge graph.
    
    Notes:
    ${notes.map(n => `- ID: ${n.id}\n  Title: ${n.title}\n  Content: ${n.content}`).join('\n\n')}

    Identify how these notes relate to each other.
    Return a JSON array of objects with:
    - sourceNoteId: string
    - targetNoteId: string
    - relationType: "depends_on" | "related_to" | "example_of" | "part_of" | "custom"
    - description: string
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceNoteId: { type: Type.STRING },
              targetNoteId: { type: Type.STRING },
              relationType: { type: Type.STRING, enum: ["depends_on", "related_to", "example_of", "part_of", "custom"] },
              description: { type: Type.STRING }
            },
            required: ["sourceNoteId", "targetNoteId", "relationType", "description"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Auto-graph error:", error);
    return [];
  }
}
