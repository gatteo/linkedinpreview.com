import './env.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !!! Warning: Dangerously allow production builds to successfully complete even if your project has type errors.
        ignoreBuildErrors: true,
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'substackcdn.com',
            },
            {
                protocol: 'https',
                hostname: 'substack-post-media.s3.amazonaws.com',
            },
        ],
    },

    // Next.js 16 uses Turbopack by default; empty config opts in explicitly.
    turbopack: {},

    // Webpack fallback config — used when building with --webpack flag.
    // Required for contentlayer's ESM/CJS interop.
    webpack: (config) => {
        config.infrastructureLogging = {
            level: 'error',
        }
        config.module?.rules?.push({
            test: /\.m?js$/,
            type: 'javascript/auto',
            resolve: { fullySpecified: false },
        })
        return config
    },
}

export default nextConfig
