import { z } from "zod";

export const SiteSchema = z.object({
    name: z.string().min(1).max(100),
    "docker-socket-enabled": z.boolean().optional().default(true)
});

// Schema for individual target within a resource
export const TargetSchema = z.object({
    site: z.string().optional(),
    method: z.enum(["http", "https", "h2c"]).optional(),
    hostname: z.string(),
    port: z.int().min(1).max(65535),
    enabled: z.boolean().optional().default(true),
    "internal-port": z.int().min(1).max(65535).optional(),
    path: z.string().optional(),
    "path-match": z.enum(["exact", "prefix", "regex"]).optional().nullable()
});
export type TargetData = z.infer<typeof TargetSchema>;

export const AuthSchema = z.object({
    // pincode has to have 6 digits
    pincode: z.number().min(100000).max(999999).optional(),
    password: z.string().min(1).optional(),
    "sso-enabled": z.boolean().optional().default(false),
    "sso-roles": z
        .array(z.string())
        .optional()
        .default([])
        .refine((roles) => !roles.includes("Admin"), {
            error: "Admin role cannot be included in sso-roles"
        }),
    "sso-users": z.array(z.email()).optional().default([]),
    "whitelist-users": z.array(z.email()).optional().default([]),
});

export const RuleSchema = z.object({
    action: z.enum(["allow", "deny", "pass"]),
    match: z.enum(["cidr", "path", "ip", "country"]),
    value: z.string()
});

export const HeaderSchema = z.object({
    name: z.string().min(1),
    value: z.string().min(1)
});

// Schema for individual resource
export const ResourceSchema = z
    .object({
        name: z.string().optional(),
        protocol: z.enum(["http", "tcp", "udp"]).optional(),
        ssl: z.boolean().optional(),
        "full-domain": z.string().optional(),
        "proxy-port": z.int().min(1).max(65535).optional(),
        enabled: z.boolean().optional(),
        targets: z.array(TargetSchema.nullable()).optional().default([]),
        auth: AuthSchema.optional(),
        "host-header": z.string().optional(),
        "tls-server-name": z.string().optional(),
        headers: z.array(HeaderSchema).optional(),
        rules: z.array(RuleSchema).optional()
    })
    .refine(
        (resource) => {
            if (isTargetsOnlyResource(resource)) {
                return true;
            }

            // Otherwise, require name and protocol for full resource definition
            return (
                resource.name !== undefined && resource.protocol !== undefined
            );
        },
        {
            path: ["name", "protocol"],
            error: "Resource must either be targets-only (only 'targets' field) or have both 'name' and 'protocol' fields at a minimum"
        }
    )
    .superRefine((resource, ctx) => {
        if (isTargetsOnlyResource(resource)) return;

        const targets = resource.targets ?? [];

        if (resource.protocol === "http") {
            for (const [i, target] of targets.entries()) {
                if (target && target.method === undefined) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Target is missing 'method' for HTTP protocol",
                        path: ["targets", i, "method"]
                    });
                }
            }
        }

        if (resource.protocol === "tcp" || resource.protocol === "udp") {
            for (const [i, target] of targets.entries()) {
                if (target && target.method !== undefined) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Target must not have 'method' for TCP/UDP protocol",
                        path: ["targets", i, "method"]
                    });
                }
            }
        }
    })
    .refine(
        (resource) => {
            if (isTargetsOnlyResource(resource)) {
                return true;
            }

            // If protocol is http, it must have a full-domain
            if (resource.protocol === "http") {
                return (
                    resource["full-domain"] !== undefined &&
                    resource["full-domain"].length > 0
                );
            }
            return true;
        },
        {
            path: ["full-domain"],
            error: "When protocol is 'http', a 'full-domain' must be provided"
        }
    )
    .refine(
        (resource) => {
            if (isTargetsOnlyResource(resource)) {
                return true;
            }

            // If protocol is tcp or udp, it must have both proxy-port
            if (resource.protocol === "tcp" || resource.protocol === "udp") {
                return resource["proxy-port"] !== undefined;
            }
            return true;
        },
        {
            path: ["proxy-port", "exit-node"],
            error: "When protocol is 'tcp' or 'udp', 'proxy-port' must be provided"
        }
    )
    .refine(
        (resource) => {
            // Skip validation for targets-only resources
            if (isTargetsOnlyResource(resource)) {
                return true;
            }

            // If protocol is tcp or udp, it must not have auth
            if (resource.protocol === "tcp" || resource.protocol === "udp") {
                return resource.auth === undefined;
            }
            return true;
        },
        {
            path: ["auth"],
            error: "When protocol is 'tcp' or 'udp', 'auth' must not be provided"
        }
    );

export function isTargetsOnlyResource(resource: any): boolean {
    return Object.keys(resource).length === 1 && resource.targets;
}

export const ClientResourceSchema = z.object({
    name: z.string().min(2).max(100),
    site: z.string().min(2).max(100).optional(),
    protocol: z.enum(["tcp", "udp"]),
    "proxy-port": z.number().min(1).max(65535),
    "hostname": z.string().min(1).max(255),
    "internal-port": z.number().min(1).max(65535),
    enabled: z.boolean().optional().default(true)   
});

// Schema for the entire configuration object
export const ConfigSchema = z
    .object({
        "proxy-resources": z.record(z.string(), ResourceSchema).optional().default({}),
        "client-resources": z.record(z.string(), ClientResourceSchema).optional().default({}),
        sites: z.record(z.string(), SiteSchema).optional().default({})
    })
    .refine(
        // Enforce the full-domain uniqueness across resources in the same stack
        (config) => {
            // Extract all full-domain values with their resource keys
            const fullDomainMap = new Map<string, string[]>();

            Object.entries(config["proxy-resources"]).forEach(
                ([resourceKey, resource]) => {
                    const fullDomain = resource["full-domain"];
                    if (fullDomain) {
                        // Only process if full-domain is defined
                        if (!fullDomainMap.has(fullDomain)) {
                            fullDomainMap.set(fullDomain, []);
                        }
                        fullDomainMap.get(fullDomain)!.push(resourceKey);
                    }
                }
            );

            // Find duplicates
            const duplicates = Array.from(fullDomainMap.entries()).filter(
                ([_, resourceKeys]) => resourceKeys.length > 1
            );

            return duplicates.length === 0;
        },
        (config) => {
            // Extract duplicates for error message
            const fullDomainMap = new Map<string, string[]>();

            Object.entries(config["proxy-resources"]).forEach(
                ([resourceKey, resource]) => {
                    const fullDomain = resource["full-domain"];
                    if (fullDomain) {
                        // Only process if full-domain is defined
                        if (!fullDomainMap.has(fullDomain)) {
                            fullDomainMap.set(fullDomain, []);
                        }
                        fullDomainMap.get(fullDomain)!.push(resourceKey);
                    }
                }
            );

            const duplicates = Array.from(fullDomainMap.entries())
                .filter(([_, resourceKeys]) => resourceKeys.length > 1)
                .map(
                    ([fullDomain, resourceKeys]) =>
                        `'${fullDomain}' used by resources: ${resourceKeys.join(", ")}`
                )
                .join("; ");

            return {
                message: `Duplicate 'full-domain' values found: ${duplicates}`,
                path: ["resources"]
            };
        }
    )
    .refine(
        // Enforce proxy-port uniqueness within proxy-resources
        (config) => {
            const proxyPortMap = new Map<number, string[]>();

            Object.entries(config["proxy-resources"]).forEach(
                ([resourceKey, resource]) => {
                    const proxyPort = resource["proxy-port"];
                    if (proxyPort !== undefined) {
                        if (!proxyPortMap.has(proxyPort)) {
                            proxyPortMap.set(proxyPort, []);
                        }
                        proxyPortMap.get(proxyPort)!.push(resourceKey);
                    }
                }
            );

            // Find duplicates
            const duplicates = Array.from(proxyPortMap.entries()).filter(
                ([_, resourceKeys]) => resourceKeys.length > 1
            );

            return duplicates.length === 0;
        },
        (config) => {
            // Extract duplicates for error message
            const proxyPortMap = new Map<number, string[]>();

            Object.entries(config["proxy-resources"]).forEach(
                ([resourceKey, resource]) => {
                    const proxyPort = resource["proxy-port"];
                    if (proxyPort !== undefined) {
                        if (!proxyPortMap.has(proxyPort)) {
                            proxyPortMap.set(proxyPort, []);
                        }
                        proxyPortMap.get(proxyPort)!.push(resourceKey);
                    }
                }
            );

            const duplicates = Array.from(proxyPortMap.entries())
                .filter(([_, resourceKeys]) => resourceKeys.length > 1)
                .map(
                    ([proxyPort, resourceKeys]) =>
                        `port ${proxyPort} used by proxy-resources: ${resourceKeys.join(", ")}`
                )
                .join("; ");

            return {
                message: `Duplicate 'proxy-port' values found in proxy-resources: ${duplicates}`,
                path: ["proxy-resources"]
            };
        }
    )
    .refine(
        // Enforce proxy-port uniqueness within client-resources
        (config) => {
            const proxyPortMap = new Map<number, string[]>();

            Object.entries(config["client-resources"]).forEach(
                ([resourceKey, resource]) => {
                    const proxyPort = resource["proxy-port"];
                    if (proxyPort !== undefined) {
                        if (!proxyPortMap.has(proxyPort)) {
                            proxyPortMap.set(proxyPort, []);
                        }
                        proxyPortMap.get(proxyPort)!.push(resourceKey);
                    }
                }
            );

            // Find duplicates
            const duplicates = Array.from(proxyPortMap.entries()).filter(
                ([_, resourceKeys]) => resourceKeys.length > 1
            );

            return duplicates.length === 0;
        },
        (config) => {
            // Extract duplicates for error message
            const proxyPortMap = new Map<number, string[]>();

            Object.entries(config["client-resources"]).forEach(
                ([resourceKey, resource]) => {
                    const proxyPort = resource["proxy-port"];
                    if (proxyPort !== undefined) {
                        if (!proxyPortMap.has(proxyPort)) {
                            proxyPortMap.set(proxyPort, []);
                        }
                        proxyPortMap.get(proxyPort)!.push(resourceKey);
                    }
                }
            );

            const duplicates = Array.from(proxyPortMap.entries())
                .filter(([_, resourceKeys]) => resourceKeys.length > 1)
                .map(
                    ([proxyPort, resourceKeys]) =>
                        `port ${proxyPort} used by client-resources: ${resourceKeys.join(", ")}`
                )
                .join("; ");

            return {
                message: `Duplicate 'proxy-port' values found in client-resources: ${duplicates}`,
                path: ["client-resources"]
            };
        }
    );

// Type inference from the schema
export type Site = z.infer<typeof SiteSchema>;
export type Target = z.infer<typeof TargetSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type Config = z.infer<typeof ConfigSchema>;
