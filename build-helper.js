import fs from "fs";
import path from "path";

const __dirname = process.cwd();
const action = process.env.BUILD_ACTION;

if (action === "clean_build") {
    const buildPath = path.join(__dirname, "build");
    if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true });
    }
} else if (action === "clean_dist") {
    const distPath = path.join(__dirname, "dist");
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true });
    }
} else if (action === "package_json") {
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
