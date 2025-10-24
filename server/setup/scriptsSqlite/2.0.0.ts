import { APP_PATH } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";

const version = "2.0.0";

export default async function migration() {
	console.log(`Running setup script ${version}...`);

	const location = path.join(APP_PATH, "db", "db.sqlite");
	const db = createClient({ url: "file:" + location });

    console.log(`${version} migration complete`);
}