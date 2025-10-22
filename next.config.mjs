import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const nextConfig = {
    cacheComponents: true,
    eslint: {
        ignoreDuringBuilds: true
    },
    output: "standalone"
};

export default withNextIntl(nextConfig);
