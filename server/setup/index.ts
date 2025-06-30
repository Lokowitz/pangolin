import { ensureActions } from "./ensureActions";
import { copyInConfig } from "./copyInConfig";
import logger from "@server/logger";
import { clearStaleData } from "./clearStaleData";

/**
 * Executes all setup operations required to initialize the application environment.
 *
 * Runs configuration import, ensures required actions and roles exist, and clears stale data from the database. Terminates the process with an error code if any setup step fails.
 */
export async function runSetupFunctions() {
    try {
        await copyInConfig(); // copy in the config to the db as needed
        await ensureActions(); // make sure all of the actions are in the db and the roles
        await clearStaleData();
    } catch (error) {
        logger.error("Error running setup functions:", error);
        process.exit(1);
    }
}
