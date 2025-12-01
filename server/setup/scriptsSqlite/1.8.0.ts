import { APP_PATH } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";

const version = "1.8.0";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const location = path.join(APP_PATH, "db", "db.sqlite");
    const db = createClient({ url: "file:" + location });

    try {
        await db.execute(`
            ALTER TABLE 'resources' ADD 'enableProxy' integer DEFAULT 1;
            ALTER TABLE 'sites' ADD 'remoteSubnets' text;
            ALTER TABLE 'user' ADD 'termsAcceptedTimestamp' text;
            ALTER TABLE 'user' ADD 'termsVersion' text;
        `);

        console.log("Migrated database schema");
    } catch (e) {
        console.log("Unable to migrate database schema");
        throw e;
    }

    console.log(`${version} migration complete`);
}
