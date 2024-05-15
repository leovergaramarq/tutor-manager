import fs from "fs";
import path from "path";
import packageJson from "./package.json" assert { type: "json" };

const action = process.env.BUILD_ACTION;

if (action === 'clean_build') {
    const buildPath = path.join(process.cwd(), "build");
    if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true });
    }
} else if (action === 'package_json') {
    const buildPath = path.join(process.cwd(), "build");
    packageJson.type = "commonjs";
    fs.writeFileSync(path.join(buildPath, "package.json"), JSON.stringify(packageJson, null, 2));
}
