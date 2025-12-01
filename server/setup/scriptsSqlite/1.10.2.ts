import { APP_PATH } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";

const version = "1.10.2";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const location = path.join(APP_PATH, "db", "db.sqlite");
    const db = createClient({ url: "file:" + location });

    const resourcesResult = await db.execute("SELECT * FROM resources");
    const resources = (resourcesResult.rows as unknown) as Array<{
        resourceId: number;
        headers: string | null;
    }>;

    try {
        for (const resource of resources) {
            const headers = resource.headers;
            if (headers && headers !== "") {
                // lets convert it to json
                // fist split at commas
                const headersArray = headers
                    .split(",")
                    .map((header: string) => {
                        const [name, ...valueParts] = header.split(":");
                        const value = valueParts.join(":").trim();
                        return { name: name.trim(), value };
                    });

                await db.execute({
                    sql: `UPDATE "resources" SET "headers" = ? WHERE "resourceId" = ?`,
                    args: [JSON.stringify(headersArray), resource.resourceId]
                });

                console.log(
                    `Updated resource ${resource.resourceId} headers to JSON format`
                );
            }
        }

        console.log(`Migrated database`);
    } catch (e) {
        console.log("Failed to migrate db:", e);
        throw e;
    }
}
