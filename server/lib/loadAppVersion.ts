import path from "path";
import { __DIRNAME } from "@server/lib/consts";
import fs from "fs";

export function loadAppVersion() {
    const packageJsonPath = path.join("package.json");
    let packageJson: any;
    if (fs.existsSync && fs.existsSync(packageJsonPath)) {
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
        packageJson = JSON.parse(packageJsonContent);

        if (packageJson.version) {
            return packageJson.version;
        }
    }
}
