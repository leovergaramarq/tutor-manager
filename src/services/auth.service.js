import crypto from "crypto";
import { db } from "../config/db.config.js";

const algorithm = "aes-256-cbc";

export function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.randomBytes(32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
        encrypted,
        authIv: iv.toString("hex"),
        authKey: key.toString("hex")
    };
}

export async function decrypt(encrypted) {
    const { authKey, authIv } = await getAuthData();
    const key = Buffer.from(authKey, "hex");
    const iv = Buffer.from(authIv, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

function getAuthData() {
    return new Promise((res, rej) => {
        db.serialize(() => {
            db.all("SELECT * FROM User", async (err, rows) => {
                if (err) {
                    return rej(err);
                }

                if (!rows.length) {
                    return rej("No user in database");
                }

                const { AuthKey: authKey, AuthIv: authIv } = rows[0];
                res({ authKey, authIv });
            });
        });
    });
}
