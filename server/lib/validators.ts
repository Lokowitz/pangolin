import z from "zod";

export function isValidCIDR(cidr: string): boolean {
    return z.string().cidr().safeParse(cidr).success;
}

export function isValidIP(ip: string): boolean {
    return z.string().ip().safeParse(ip).success;
}

export function isValidUrlGlobPattern(pattern: string): boolean {
    if (pattern === "/") {
        return true;
    }

    // Remove leading slash if present
    pattern = pattern.startsWith("/") ? pattern.slice(1) : pattern;

    // Empty string is not valid
    if (!pattern) {
        return false;
    }

    // Split path into segments
    const segments = pattern.split("/");

    // Check each segment
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Empty segments are not allowed (double slashes), except at the end
        if (!segment && i !== segments.length - 1) {
            return false;
        }

        // Check each character in the segment
        for (let j = 0; j < segment.length; j++) {
            const char = segment[j];

            // Check for percent-encoded sequences
            if (char === "%" && j + 2 < segment.length) {
                const hex1 = segment[j + 1];
                const hex2 = segment[j + 2];
                if (
                    !/^[0-9A-Fa-f]$/.test(hex1) ||
                    !/^[0-9A-Fa-f]$/.test(hex2)
                ) {
                    return false;
                }
                j += 2; // Skip the next two characters
                continue;
            }

            // Allow:
            // - unreserved (A-Z a-z 0-9 - . _ ~)
            // - sub-delims (! $ & ' ( ) * + , ; =)
            // - @ : for compatibility with some systems
            if (!/^[A-Za-z0-9\-._~!$&'()*+,;#=@:]$/.test(char)) {
                return false;
            }
        }
    }

    return true;
}

export function isUrlValid(url: string | undefined) {
    if (!url) return true; // the link is optional in the schema so if it's empty it's valid
    var pattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
        "i"
    );
    return !!pattern.test(url);
}

export function isTargetValid(value: string | undefined) {
    if (!value) return true;

    const DOMAIN_REGEX =
        /^[a-zA-Z0-9_](?:[a-zA-Z0-9-_]{0,61}[a-zA-Z0-9_])?(?:\.[a-zA-Z0-9_](?:[a-zA-Z0-9-_]{0,61}[a-zA-Z0-9_])?)*$/;
    const IPV4_REGEX =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const IPV6_REGEX = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;

    if (IPV4_REGEX.test(value) || IPV6_REGEX.test(value)) {
        return true;
    }

    return DOMAIN_REGEX.test(value);
}
