import crypto from "node:crypto";

// Chiffrement symétrique AES-256-GCM des données sensibles (token OAuth GitHub).
// La clé (32 octets) vient de TOKEN_ENC_KEY, distincte de SESSION_SECRET.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// Récupère la clé de chiffrement depuis l'environnement (64 caractères hexadécimaux).
const getKey = () => {
    const key = process.env.TOKEN_ENC_KEY;
    if (!key || key.length !== 64) {
        throw new Error("TOKEN_ENC_KEY manquante ou invalide (64 caractères hexadécimaux attendus).");
    }
    return Buffer.from(key, "hex");
};

/**
 * Chiffre une chaîne. Le résultat "iv:tag:ciphertext" (base64) embarque un IV
 * aléatoire propre à chaque appel.
 * @param {string} plainText
 * @returns {string}
 */
export const encrypt = (plainText) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

/**
 * Déchiffre une chaîne produite par encrypt().
 * @param {string} payload
 * @returns {string}
 */
export const decrypt = (payload) => {
    const [ivB64, tagB64, dataB64] = (payload ?? "").split(":");
    if (!ivB64 || !tagB64 || !dataB64) {
        throw new Error("Donnée chiffrée invalide (format attendu iv:tag:ciphertext).");
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataB64, "base64")),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
};
