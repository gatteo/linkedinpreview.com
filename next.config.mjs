import './env.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !!! Warning: Dangerously allow production builds to successfully complete even if your project has type errors.
        ignoreBuildErrors: true,
    },

    eslint: {
        // !!! Warning: This allows production builds to successfully complete even if your project has ESLint errors.
        ignoreDuringBuilds: true,
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

    webpack: (config) => {
        config.infrastructureLogging = {
            level: 'error',
        }
        // Required for contentlayer's ESM/CJS interop (replaces withContentlayer wrapper).
        // We run contentlayer separately via the build script with NODE_ENV=production
        // to ensure the compiled MDX uses the production JSX transform, avoiding the
        // React 19 "t.getOwner is not a function" error during static prerendering.
        config.module?.rules?.push({
            test: /\.m?js$/,
            type: 'javascript/auto',
            resolve: { fullySpecified: false },
        })
        return config
    },
}

export default nextConfig
