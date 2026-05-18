import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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
            schemas: {},
        },
        security: [{ sessionAuth: [] }],
    },
    apis: [new URL("./routes/*.js", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")],
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
