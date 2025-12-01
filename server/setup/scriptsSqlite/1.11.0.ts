import { APP_PATH } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { randomUUID } from "crypto";

const version = "1.11.0";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const location = path.join(APP_PATH, "db", "db.sqlite");
    const db = createClient({ url: "file:" + location });

    await db.execute(`
    CREATE TABLE 'account' (
        'accountId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'userId' text NOT NULL,
        FOREIGN KEY ('userId') REFERENCES 'user'('id') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'accountDomains' (
        'accountId' integer NOT NULL,
        'domainId' text NOT NULL,
        FOREIGN KEY ('accountId') REFERENCES 'account'('accountId') ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY ('domainId') REFERENCES 'domains'('domainId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'certificates' (
        'certId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'domain' text NOT NULL,
        'domainId' text,
        'wildcard' integer DEFAULT false,
        'status' text DEFAULT 'pending' NOT NULL,
        'expiresAt' integer,
        'lastRenewalAttempt' integer,
        'createdAt' integer NOT NULL,
        'updatedAt' integer NOT NULL,
        'orderId' text,
        'errorMessage' text,
        'renewalCount' integer DEFAULT 0,
        'certFile' text,
        'keyFile' text,
        FOREIGN KEY ('domainId') REFERENCES 'domains'('domainId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`CREATE UNIQUE INDEX 'certificates_domain_unique' ON 'certificates' ('domain');`);

    await db.execute(`
    CREATE TABLE 'customers' (
        'customerId' text PRIMARY KEY NOT NULL,
        'orgId' text NOT NULL,
        'email' text,
        'name' text,
        'phone' text,
        'address' text,
        'createdAt' integer NOT NULL,
        'updatedAt' integer NOT NULL,
        FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'dnsChallenges' (
        'dnsChallengeId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'domain' text NOT NULL,
        'token' text NOT NULL,
        'keyAuthorization' text NOT NULL,
        'createdAt' integer NOT NULL,
        'expiresAt' integer NOT NULL,
        'completed' integer DEFAULT false
    );
    `);

    await db.execute(`
    CREATE TABLE 'domainNamespaces' (
        'domainNamespaceId' text PRIMARY KEY NOT NULL,
        'domainId' text NOT NULL,
        FOREIGN KEY ('domainId') REFERENCES 'domains'('domainId') ON UPDATE no action ON DELETE set null
    );
    `);

    await db.execute(`
    CREATE TABLE 'exitNodeOrgs' (
        'exitNodeId' integer NOT NULL,
        'orgId' text NOT NULL,
        FOREIGN KEY ('exitNodeId') REFERENCES 'exitNodes'('exitNodeId') ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'loginPage' (
        'loginPageId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'subdomain' text,
        'fullDomain' text,
        'exitNodeId' integer,
        'domainId' text,
        FOREIGN KEY ('exitNodeId') REFERENCES 'exitNodes'('exitNodeId') ON UPDATE no action ON DELETE set null,
        FOREIGN KEY ('domainId') REFERENCES 'domains'('domainId') ON UPDATE no action ON DELETE set null
    );
    `);

    await db.execute(`
    CREATE TABLE 'loginPageOrg' (
        'loginPageId' integer NOT NULL,
        'orgId' text NOT NULL,
        FOREIGN KEY ('loginPageId') REFERENCES 'loginPage'('loginPageId') ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'remoteExitNodeSession' (
        'id' text PRIMARY KEY NOT NULL,
        'remoteExitNodeId' text NOT NULL,
        'expiresAt' integer NOT NULL,
        FOREIGN KEY ('remoteExitNodeId') REFERENCES 'remoteExitNode'('id') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'remoteExitNode' (
        'id' text PRIMARY KEY NOT NULL,
        'secretHash' text NOT NULL,
        'dateCreated' text NOT NULL,
        'version' text,
        'exitNodeId' integer,
        FOREIGN KEY ('exitNodeId') REFERENCES 'exitNodes'('exitNodeId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'sessionTransferToken' (
        'token' text PRIMARY KEY NOT NULL,
        'sessionId' text NOT NULL,
        'encryptedSession' text NOT NULL,
        'expiresAt' integer NOT NULL,
        FOREIGN KEY ('sessionId') REFERENCES 'session'('id') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'subscriptionItems' (
        'subscriptionItemId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'subscriptionId' text NOT NULL,
        'planId' text NOT NULL,
        'priceId' text,
        'meterId' text,
        'unitAmount' real,
        'tiers' text,
        'interval' text,
        'currentPeriodStart' integer,
        'currentPeriodEnd' integer,
        'name' text,
        FOREIGN KEY ('subscriptionId') REFERENCES 'subscriptions'('subscriptionId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'subscriptions' (
        'subscriptionId' text PRIMARY KEY NOT NULL,
        'customerId' text NOT NULL,
        'status' text DEFAULT 'active' NOT NULL,
        'canceledAt' integer,
        'createdAt' integer NOT NULL,
        'updatedAt' integer,
        'billingCycleAnchor' integer,
        FOREIGN KEY ('customerId') REFERENCES 'customers'('customerId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'usage' (
        'usageId' text PRIMARY KEY NOT NULL,
        'featureId' text NOT NULL,
        'orgId' text NOT NULL,
        'meterId' text,
        'instantaneousValue' real,
        'latestValue' real NOT NULL,
        'previousValue' real,
        'updatedAt' integer NOT NULL,
        'rolledOverAt' integer,
        'nextRolloverAt' integer,
        FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'usageNotifications' (
        'notificationId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'orgId' text NOT NULL,
        'featureId' text NOT NULL,
        'limitId' text NOT NULL,
        'notificationType' text NOT NULL,
        'sentAt' integer NOT NULL,
        FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'resourceHeaderAuth' (
        'headerAuthId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'resourceId' integer NOT NULL,
        'headerAuthHash' text NOT NULL,
        FOREIGN KEY ('resourceId') REFERENCES 'resources'('resourceId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`
    CREATE TABLE 'targetHealthCheck' (
        'targetHealthCheckId' integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        'targetId' integer NOT NULL,
        'hcEnabled' integer DEFAULT false NOT NULL,
        'hcPath' text,
        'hcScheme' text,
        'hcMode' text DEFAULT 'http',
        'hcHostname' text,
        'hcPort' integer,
        'hcInterval' integer DEFAULT 30,
        'hcUnhealthyInterval' integer DEFAULT 30,
        'hcTimeout' integer DEFAULT 5,
        'hcHeaders' text,
        'hcFollowRedirects' integer DEFAULT true,
        'hcMethod' text DEFAULT 'GET',
        'hcStatus' integer,
        'hcHealth' text DEFAULT 'unknown',
        FOREIGN KEY ('targetId') REFERENCES 'targets'('targetId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`DROP TABLE 'limits';`);

    await db.execute(`
    CREATE TABLE 'limits' (
        'limitId' text PRIMARY KEY NOT NULL,
        'featureId' text NOT NULL,
        'orgId' text NOT NULL,
        'value' real,
        'description' text,
        FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade
    );
    `);

    await db.execute(`ALTER TABLE 'orgs' ADD 'settings' text;`);
    await db.execute(`ALTER TABLE 'targets' ADD 'rewritePath' text;`);
    await db.execute(`ALTER TABLE 'targets' ADD 'rewritePathType' text;`);
    await db.execute(`ALTER TABLE 'targets' ADD 'priority' integer DEFAULT 100 NOT NULL;`);

    const webauthnCredentials = db.execute({
        sql: `SELECT credentialId, publicKey, userId, signCount, transports, name, lastUsed, dateCreated FROM 'webauthnCredentials'`
        )
        as {
        credentialId: string;
        publicKey: string;
        userId: string;
        signCount: number;
        transports: string | null;
        name: string | null;
        lastUsed: string;
        dateCreated: string;
    }[];

    await db.execute(`DELETE FROM 'webauthnCredentials';`); 

    for (const webauthnCredential of webauthnCredentials) {
        const newCredentialId = isoBase64URL.fromBuffer(
            new Uint8Array(
                Buffer.from(webauthnCredential.credentialId, "base64")
            )
        );
        const newPublicKey = isoBase64URL.fromBuffer(
            new Uint8Array(
                Buffer.from(webauthnCredential.publicKey, "base64")
            )
        );

        // Insert the updated record with converted values
        await db.execute({
            sql: `INSERT INTO 'webauthnCredentials' (credentialId, publicKey, userId, signCount, transports, name, lastUsed, dateCreated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                newCredentialId,
                newPublicKey,
                webauthnCredential.userId,
                webauthnCredential.signCount,
                webauthnCredential.transports,
                webauthnCredential.name,
                webauthnCredential.lastUsed,
                webauthnCredential.dateCreated
            ]
        });
    }

    // 1. Add the column (nullable or with placeholder) if it doesn’t exist yet
    await db.execute(
        `ALTER TABLE resources ADD COLUMN resourceGuid TEXT DEFAULT 'PLACEHOLDER';`
    );

    // 2. Select all rows
    const resources = await db.execute(`SELECT resourceId FROM resources`) as {
        resourceId: number;
    }[];

    // 3. Prefill with random UUIDs
    const updateStmt = await db.execute(
        `UPDATE resources SET resourceGuid = ? WHERE resourceId = ?`
    );

    for (const row of resources) {
        updateStmt.run(randomUUID(), row.resourceId);
    }

    // get all of the targets
    const targets = await db.execute(`SELECT targetId FROM targets`).all() as {
        targetId: number;
    }[];

    const insertTargetHealthCheckStmt = await db.execute(
        `INSERT INTO targetHealthCheck (targetId) VALUES (?)`
    );

    for (const target of targets) {
        insertTargetHealthCheckStmt.run(target.targetId);
    }

    await db.execute(
        `CREATE UNIQUE INDEX resources_resourceGuid_unique ON resources ('resourceGuid');`
    );

    console.log(`${version} migration complete`);
}
