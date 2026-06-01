import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import router from "./routes/index.js";
import { sanitize } from "./middlewares/sanitizeMiddleware.js";
import { setupSwagger } from "./swagger.js";
import { recoverInterruptedAnalyses } from "./services/analysisService.js";

const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares globaux ---
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 },
    })
);
app.use(sanitize);

// --- Routes API ---
app.use("/codementor/api", router);

// --- Documentation Swagger ---
setupSwagger(app);

// --- Gestion des erreurs de validation (express-joi-validation) ---
app.use((err, req, res, next) => {
    if (err && err.error && err.error.isJoi) {
        return res.status(400).json({
            error: "Données invalides.",
            details: err.error.details.map((d) => d.message),
        });
    }
    next(err);
});

// --- Gestionnaire d'erreurs général ---
app.use((err, req, res, next) => {
    // Erreur applicative typée (AppError) : on renvoie son code et son message.
    if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    // Sinon, erreur inattendue : 500 sans exposer de détail interne.
    console.error("Erreur non gérée :", err);
    res.status(500).json({ error: "Erreur serveur." });
});

// --- Démarrage ---
const startServer = async () => {
    try {
        // Nettoie les analyses laissées en cours par un précédent arrêt du serveur.
        await recoverInterruptedAnalyses();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Impossible de démarrer le serveur :", error);
    }
};

startServer();
