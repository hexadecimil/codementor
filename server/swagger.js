import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Chemin absolu vers les fichiers de routes (glob), avec slashes avant pour glob.
const routesGlob = path
    .join(path.dirname(fileURLToPath(import.meta.url)), "routes", "*.js")
    .replace(/\\/g, "/");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CodeMentor API",
            version: "1.0.0",
            description: `
API REST de CodeMentor : analyse de dépôts GitHub assistée par IA.

## Authentification
Les routes protégées nécessitent une session active.
1. Initier la connexion via **GET /api/auth/login** (redirection OAuth GitHub).
2. Le serveur stocke la session après le callback GitHub.
            `,
        },
        servers: [
            { url: "http://localhost:3000/codementor", description: "Serveur local" },
        ],
        components: {
            securitySchemes: {
                sessionAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "connect.sid",
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    properties: {
                        error: { type: "string", example: "Projet introuvable" },
                    },
                },
                ValidationError: {
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Données invalides." },
                        details: {
                            type: "array",
                            items: { type: "string" },
                            example: ['"github_repo_url" is required'],
                        },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        github_id: { type: "integer", example: 1234567 },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                Project: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        user_id: { type: "integer", example: 1 },
                        github_repo_url: {
                            type: "string",
                            example: "https://github.com/user/repo",
                        },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                DetectedError: {
                    type: "object",
                    properties: {
                        line_number: { type: "integer", nullable: true, example: 42 },
                        error_type: {
                            type: "string",
                            enum: ["syntax", "logic", "security", "performance", "style", "deprecation"],
                        },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        description: { type: "string" },
                        code_snippet: { type: "string", nullable: true },
                        fix_description: { type: "string", nullable: true },
                        fix_suggested_code: { type: "string", nullable: true },
                    },
                },
                AnalyzedFile: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        file_path: { type: "string", example: "src/app.js" },
                        language: { type: "string", nullable: true, example: "js" },
                        file_summary: { type: "string", nullable: true },
                        errors: {
                            type: "array",
                            items: { $ref: "#/components/schemas/DetectedError" },
                        },
                    },
                },
                Analysis: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        project_id: { type: "integer", example: 1 },
                        commit_sha: { type: "string", nullable: true },
                        status: {
                            type: "string",
                            enum: ["queued", "running", "completed", "failed"],
                        },
                        files_total: { type: "integer", nullable: true, example: 12 },
                        files_done: {
                            type: "integer",
                            example: 5,
                            description: "Fichiers déjà analysés et persistés. Progression ≈ files_done / files_total.",
                        },
                        code_overview: { type: "string", nullable: true },
                        mermaid_diagram: { type: "string", nullable: true },
                        error_message: { type: "string", nullable: true },
                        analysis_date: { type: "string", format: "date-time" },
                    },
                },
                AnalysisSummary: {
                    type: "object",
                    description:
                        "Version allégée renvoyée dans l'historique d'un projet (liste).",
                    properties: {
                        id: { type: "integer", example: 1 },
                        status: {
                            type: "string",
                            enum: ["queued", "running", "completed", "failed"],
                        },
                        files_total: { type: "integer", nullable: true, example: 12 },
                        analysis_date: { type: "string", format: "date-time" },
                    },
                },
                AnalysisFull: {
                    allOf: [
                        { $ref: "#/components/schemas/Analysis" },
                        {
                            type: "object",
                            properties: {
                                files: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/AnalyzedFile" },
                                },
                            },
                        },
                    ],
                },
            },
            responses: {
                Unauthorized: {
                    description: "Non connecté (pas de session active).",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                NotFound: {
                    description: "Ressource introuvable.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                ValidationError: {
                    description: "Données invalides.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                ServerError: {
                    description: "Erreur interne du serveur.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "string", example: "Erreur serveur." },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [{ sessionAuth: [] }],
    },
    apis: [routesGlob],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use(
        "/codementor/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customSiteTitle: "CodeMentor API Docs",
            swaggerOptions: { persistAuthorization: true },
        })
    );
};
