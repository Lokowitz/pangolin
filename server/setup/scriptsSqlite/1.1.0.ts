import { APP_PATH } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";

const version = "1.1.0";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const location = path.join(APP_PATH, "db", "db.sqlite");
    const db = createClient({ url: "file:" + location });

    try {
        await db.execute(
            `CREATE TABLE 'supporterKey' (
            'keyId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            'key' text NOT NULL,
            'githubUsername' text NOT NULL,
            'phrase' text,
            'tier' text,
            'valid' integer DEFAULT false NOT NULL
            );`
        );

        console.log(`Migrated database schema`);
    } catch (e) {
        console.log("Unable to migrate database schema");
        throw e;
    }

    console.log(`${version} migration complete`);
}
