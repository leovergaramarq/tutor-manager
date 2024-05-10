export function encodeBase64(string) {
    return Buffer.from(string).toString("base64");
}

export function decodeBase64(string) {
    return Buffer.from(string, "base64").toString("utf-8");
}
