"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("@google-cloud/functions-framework"));
const generative_ai_1 = require("@google/generative-ai");
const CONVENTIONS = `
- Debe estar escrito en español.
- No debe contener caracteres especiales ni emojis.
- Debe ser claro y conciso, describiendo brevemente el propósito de la issue.
- Debe comenzar con un verbo en infinitivo que llame a la acción que se realizará.
- La primera letra del título debe estar en mayúscula, y el resto en minúscula (excepto nombres propios o siglas).
`;
function buildPrompt(title) {
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
function sendError(response, status, message) {
    const body = { error: message };
    response.status(status).json(body);
}
functions.http("checkIssueConventions", async (request, response) => {
    if (request.method !== "POST") {
        sendError(response, 405, "Method not allowed");
        return;
    }
    const body = request.body;
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
    const genai = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
        },
    });
    const result = await model.generateContent(buildPrompt(title));
    const checkResponse = JSON.parse(result.response.text());
    response.status(200).json(checkResponse);
});
