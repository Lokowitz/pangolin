#! /usr/bin/env node
import { migrate } from "drizzle-orm/libsql/migrator";
import { db, exists } from "../db/sqlite";
import path from "path";
import semver from "semver";
import { versionMigrations } from "../db/sqlite";
import { __DIRNAME, APP_PATH, APP_VERSION } from "@server/lib/consts";
import { LibsqlError } from "@libsql/client";
import fs from "fs";
import m30 from "./scriptsSqlite/2.0.0";

// THIS CANNOT IMPORT ANYTHING FROM THE SERVER
// EXCEPT FOR THE DATABASE AND THE SCHEMA

// Define the migration list with versions and their corresponding functions
const migrations = [
    { version: "2.0.0", run: m30 },
    // Add new migrations here as they are created
] as const;

await run();

async function run() {
    // run the migrations
    await runMigrations();
}

function backupDb() {
    // make dir config/db/backups
    const appPath = APP_PATH;
    const dbDir = path.join(appPath, "db");

    const backupsDir = path.join(dbDir, "backups");

    // check if the backups directory exists and create it if it doesn't
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    // copy the db.sqlite file to backups
    // add the date to the filename
    const date = new Date();
    const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    const dbPath = path.join(dbDir, "db.sqlite");
    const backupPath = path.join(backupsDir, `db_${dateString}.sqlite`);
    fs.copyFileSync(dbPath, backupPath);
}

export async function runMigrations() {
    if (process.env.DISABLE_MIGRATIONS) {
        console.log("Migrations are disabled. Skipping...");
        return;
    }
    try {
        const appVersion = APP_VERSION;

        if (exists) {
            await executeScripts();
        } else {
            console.log("Running migrations...");
            try {
                migrate(db, {
                    migrationsFolder: path.join(__DIRNAME, "init") // put here during the docker build
                });
                console.log("Migrations completed successfully.");
            } catch (error) {
                console.error("Error running migrations:", error);
            }

            await db
                .insert(versionMigrations)
                .values({
                    version: appVersion,
                    executedAt: Date.now()
                })
                .execute();
        }
    } catch (e) {
        console.error("Error running migrations:", e);
        await new Promise((resolve) =>
            setTimeout(resolve, 1000 * 60 * 60 * 24 * 1)
        );
    }
}

async function executeScripts() {
    try {
        const requiredMinimumVersion = "1.11.1";
        // Get the last executed version from the database
        const lastExecuted = await db.select().from(versionMigrations);

        // Filter and sort migrations
        const pendingMigrations = lastExecuted
            .map((m) => m)
            .sort((a, b) => semver.compare(b.version, a.version));
        const startVersion = pendingMigrations[0]?.version ?? APP_VERSION;

        if (semver.lt(startVersion, requiredMinimumVersion)) {
            console.error(`Starting App not allowed. Your previous version is: ${startVersion}.`);
            console.error(`Please update first to version ${requiredMinimumVersion} due to breaking changes in version 2.0.0.`);
            process.exit(1);
        }

        console.log(`Starting migrations from version ${startVersion}`);

        const migrationsToRun = migrations.filter((migration) =>
            semver.gt(migration.version, startVersion)
        );

        console.log(
            "Migrations to run:",
            migrationsToRun.map((m) => m.version).join(", ")
        );

        // Run migrations in order
        for (const migration of migrationsToRun) {
            console.log(`Running migration ${migration.version}`);

            try {
                if (!process.env.DISABLE_BACKUP_ON_MIGRATION) {
                    // Backup the database before running the migration
                    backupDb();
                }

                await migration.run();

                // Update version in database
                await db
                    .insert(versionMigrations)
                    .values({
                        version: migration.version,
                        executedAt: Date.now()
                    })
                    .execute();

                console.log(
                    `Successfully completed migration ${migration.version}`
                );
            } catch (e) {
                if (
                    e instanceof LibsqlError &&
                    e.code === "SQLITE_CONSTRAINT_UNIQUE"
                ) {
                    console.error("Migration has already run! Skipping...");
                    continue;
                }
                console.error(
                    `Failed to run migration ${migration.version}:`,
                    e
                );
                throw e; // Re-throw to stop migration process
            }
        }

        console.log("All migrations completed successfully");
    } catch (error) {
        console.error("Migration process failed:", error);
        throw error;
    }
}
