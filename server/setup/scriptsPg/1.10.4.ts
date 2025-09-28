import { db } from "@server/db/pg/driver";
import { sql } from "drizzle-orm";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

const version = "1.10.4";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    try {
        await db.execute(sql`BEGIN`);

        const webauthnCredentialsQuery = await db.execute(sql`SELECT "credentialId", "publicKey", "userId", "signCount", "transports", "name", "lastUsed", "dateCreated" FROM "webauthnCredentials"`);

        const webauthnCredentials = webauthnCredentialsQuery.rows as { 
            credentialId: string; 
            publicKey: string; 
            userId: string; 
            signCount: number; 
            transports: string | null; 
            name: string | null; 
            lastUsed: string; 
            dateCreated: string;
        }[];

        for (const webauthnCredential of webauthnCredentials) {
            const newCredentialId = isoBase64URL.fromBuffer(new Uint8Array(Buffer.from(webauthnCredential.credentialId, 'base64')));
            const newPublicKey = isoBase64URL.fromBuffer(new Uint8Array(Buffer.from(webauthnCredential.publicKey, 'base64')));
            
            // Delete the old record
            await db.execute(sql`
                DELETE FROM "webauthnCredentials" 
                WHERE "credentialId" = ${webauthnCredential.credentialId}
            `);
            
            // Insert the updated record with converted values
            await db.execute(sql`
                INSERT INTO "webauthnCredentials" ("credentialId", "publicKey", "userId", "signCount", "transports", "name", "lastUsed", "dateCreated")
                VALUES (${newCredentialId}, ${newPublicKey}, ${webauthnCredential.userId}, ${webauthnCredential.signCount}, ${webauthnCredential.transports}, ${webauthnCredential.name}, ${webauthnCredential.lastUsed}, ${webauthnCredential.dateCreated})
            `);
        }

        await db.execute(sql`COMMIT`);
        console.log(`Updated credentialId and publicKey`);
    } catch (e) {
        await db.execute(sql`ROLLBACK`);
        console.log("Unable to update credentialId and publicKey");
        console.log(e);
        throw e;
    }

    console.log(`${version} migration complete`);
}
