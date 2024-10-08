import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const action = process.env.BUILD_ACTION;

if (action === "CLEAN_BUILD") {
    const buildPath = path.join(__dirname, "build");
    if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true });
    }
} else if (action === "CLEAN_DIST") {
    const distPath = path.join(__dirname, "dist");
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true });
    }
} else if (action === "PARSE_PACKAGE_JSON") {
    const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, "package.json"))
    );

    packageJson.type = "commonjs";

    ["build", "dist:exe", "dist"].forEach(
        (script) => delete packageJson.scripts[script]
    );
    delete packageJson.pkg;

    const packageJsonStr = JSON.stringify(packageJson, null, 2).replace(
        /build\//g,
        ""
    );

    const buildPath = path.join(__dirname, "build");

    fs.writeFileSync(path.join(buildPath, "package.json"), packageJsonStr);
}
