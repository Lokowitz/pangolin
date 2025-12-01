import { APP_PATH } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";

const version = "1.11.1";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const location = path.join(APP_PATH, "db", "db.sqlite");
    const db = createClient({ url: "file:" + location });

    await db.execute(`UPDATE exitNodes SET online = 1`); // mark exit nodes as online

    console.log(`${version} migration complete`);
}
