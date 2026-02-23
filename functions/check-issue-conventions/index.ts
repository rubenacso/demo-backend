import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Request, Response } from "@google-cloud/functions-framework";
import * as functions from "@google-cloud/functions-framework";

interface CheckRequest {
  title: string;
}

type CheckResponse = { valid: true } | { valid: false; comment: string };

interface ErrorResponse {
  error: string;
}

const CONVENTIONS = `
- Debe estar escrito en español.
- No debe contener caracteres especiales ni emojis.
- Debe ser claro y conciso, describiendo brevemente el propósito de la issue.
- Debe comenzar con un verbo en infinitivo que llame a la acción que se realizará.
- La primera letra del título debe estar en mayúscula, y el resto en minúscula (excepto nombres propios o siglas).
`;

function buildPrompt(title: string): string {
  return `
Eres un asistente que revisa títulos de issues de GitHub.

Comprueba si el siguiente título cumple TODAS estas convenciones:
${CONVENTIONS}

Título: "${title}"

Responde ÚNICAMENTE con un objeto JSON válido con este formato exacto, sin explicaciones adicionales:
{"valid": true} si el título cumple todas las convenciones.
{"valid": false, "comment": "<mensaje en español indicando los problemas encontrados y sugiriendo un título corregido>"} si no cumple alguna.
`.trim();
}

function sendError(response: Response, status: number, message: string): void {
  const body: ErrorResponse = { error: message };
  response.status(status).json(body);
}

functions.http(
  "checkIssueConventions",
  async (request: Request, response: Response) => {
    if (request.method !== "POST") {
      sendError(response, 405, "Method not allowed");
      return;
    }

    const body = request.body as Partial<CheckRequest>;

    if (!body || typeof body.title !== "string") {
      sendError(response, 400, "Missing 'title' field");
      return;
    }

    const title = body.title.trim();

    if (!title) {
      sendError(response, 400, "Title cannot be empty");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      sendError(response, 500, "GEMINI_API_KEY not configured");
      return;
    }

    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(buildPrompt(title));
    const checkResponse = JSON.parse(result.response.text()) as CheckResponse;

    response.status(200).json(checkResponse);
  },
);
