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
- El formato debe ser: [Verbo en infinitivo] [descripción breve del cambio] #[número-issue]
- Debe estar escrito en español.
- El primer carácter debe estar en mayúscula.
- Debe contener al menos una referencia a una issue (por ejemplo: #45), puede contener varias.
- Debe ser descriptivo y claro, no genérico ni confuso.

Ejemplos válidos:
- Corregir validación de email en formulario de registro #45
- Añadir función para calcular el total de la compra #78 #79
- Actualizar versiones de las dependencias #102
`;

function buildPrompt(title: string): string {
  return `
Eres un asistente que revisa títulos de pull requests de GitHub.

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
  "checkPrConventions",
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
