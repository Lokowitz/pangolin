import { db } from "@server/db/pg/driver";
import { configFilePath1, configFilePath2 } from "@server/lib/consts";
import { sql } from "drizzle-orm";
import fs from "fs";
import yaml from "js-yaml";

const version = "1.6.0";

/**
 * Performs migration tasks for version 1.6.0, including updating user emails and usernames to lowercase in the database and modifying the configuration file to set `server.trust_proxy` to 1 if applicable.
 *
 * Updates all entries in the 'user' table to ensure email and username fields are lowercase. Locates and updates the configuration YAML file to explicitly set the `server.trust_proxy` property to 1 if it is present and truthy. Logs progress and errors throughout the process.
 */
export default async function migration() {
    console.log(`Running setup script ${version}...`);

    try {
        db.execute(sql`UPDATE 'user' SET email = LOWER(email);`);
        db.execute(sql`UPDATE 'user' SET username = LOWER(username);`);
        console.log(`Migrated database schema`);
    } catch (e) {
        console.log("Unable to make all usernames and emails lowercase");
        console.log(e);
    }

    try {
        // Determine which config file exists
        const filePaths = [configFilePath1, configFilePath2];
        let filePath = "";
        for (const path of filePaths) {
            if (fs.existsSync(path)) {
                filePath = path;
                break;
            }
        }

        if (!filePath) {
            throw new Error(
                `No config file found (expected config.yml or config.yaml).`
            );
        }

        // Read and parse the YAML file
        let rawConfig: any;
        const fileContents = fs.readFileSync(filePath, "utf8");
        rawConfig = yaml.load(fileContents);

        if (rawConfig.server?.trust_proxy) {
            rawConfig.server.trust_proxy = 1;
        }

        // Write the updated YAML back to the file
        const updatedYaml = yaml.dump(rawConfig);
        fs.writeFileSync(filePath, updatedYaml, "utf8");

        console.log(`Set trust_proxy to 1 in config file`);
    } catch (e) {
        console.log(`Unable to migrate config file. Error: ${e}`);
    }

    console.log(`${version} migration complete`);
}
