import { APP_PATH, configFilePath1, configFilePath2 } from "@server/lib/consts";
import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { domains, orgDomains, resources } from "@server/db";

const version = "1.0.0-beta.15";

export default async function migration() {
    console.log(`Running setup script ${version}...`);

    const location = path.join(APP_PATH, "db", "db.sqlite");
    const db = createClient({ url: "file:" + location });

    let domain = "";

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
        const fileContents = fs.readFileSync(filePath, "utf8");
        const rawConfig = yaml.load(fileContents) as any;

        const baseDomain = rawConfig.app.base_domain;
        const certResolver = rawConfig.traefik.cert_resolver;
        const preferWildcardCert = rawConfig.traefik.prefer_wildcard_cert;

        delete rawConfig.traefik.prefer_wildcard_cert;
        delete rawConfig.traefik.cert_resolver;
        delete rawConfig.app.base_domain;

        rawConfig.domains = {
            domain1: {
                base_domain: baseDomain
            }
        };

        if (certResolver) {
            rawConfig.domains.domain1.cert_resolver = certResolver;
        }

        if (preferWildcardCert) {
            rawConfig.domains.domain1.prefer_wildcard_cert = preferWildcardCert;
        }

        // Write the updated YAML back to the file
        const updatedYaml = yaml.dump(rawConfig);
        fs.writeFileSync(filePath, updatedYaml, "utf8");

        domain = baseDomain;

        console.log(`Moved base_domain to new domains section`);
    } catch (e) {
        console.log(
            `Unable to migrate config file and move base_domain to domains. Error: ${e}`
        );
        throw e;
    }

    try {
        await db.execute(
            `CREATE TABLE 'domains' (
            'domainId' text PRIMARY KEY NOT NULL,
            'baseDomain' text NOT NULL,
            'configManaged' integer DEFAULT false NOT NULL
            );`
        );

        await db.execute(
            `CREATE TABLE 'orgDomains' (
            'orgId' text NOT NULL,
            'domainId' text NOT NULL,
            FOREIGN KEY ('orgId') REFERENCES 'orgs'('orgId') ON UPDATE no action ON DELETE cascade,
            FOREIGN KEY ('domainId') REFERENCES 'domains'('domainId') ON UPDATE no action ON DELETE cascade
            );`
        );

        await db.execute(
            `ALTER TABLE 'resources' ADD 'domainId' text REFERENCES domains(domainId);`
        );

        await db.execute(
            `ALTER TABLE 'orgs' DROP COLUMN 'domain';`
        );

        console.log(`Migrated database schema`);
    } catch (e) {
        console.log("Unable to migrate database schema");
        throw e;
    }

    try {
        await db.execute({
            sql: `INSERT INTO domains (domainId, baseDomain, configManaged) VALUES (?, ?, ?)`,
            args: ["domain1", domain, 1]
        });

        await db.execute({
            sql: `UPDATE resources SET domainId = ?`,
            args: ["domain1"]
        });

        const existingOrgDomainsResult = await db.execute(`SELECT orgId FROM orgDomains`);
        const existingOrgDomains = (existingOrgDomainsResult.rows as unknown) as Array<{
            orgId: string;
        }>;

        for (const orgDomain of existingOrgDomains) {
            await db.execute({
                sql: `INSERT INTO orgDomains (orgId, domainId) VALUES (?, ?)`,
                args: [orgDomain.orgId, "domain1"]
            });
        }

        console.log(`Updated resources table with new domainId`);

    } catch (e) {
        console.log(
            `Unable to update resources table with new domainId. Error: ${e}`
        );
        return;
    }

    console.log(`${version} migration complete`);
}
