/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  // Disable React strict mode to avoid double rendering in development
  reactStrictMode: false,
  // Exclude tempobook directories from the build
  output: "standalone",
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "**/tempobook/**",
        "**/tempobook/dynamic/**",
        "**/tempobook/storyboards/**",
      ],
    },
  },
  // Explicitly ignore tempobook directory during build
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next",
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Explicitly tell Next.js to ignore these directories
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/tempobook/**", "**/node_modules/**"],
    };
    return config;
  },
  // Exclude specific directories from being processed by Next.js
  pageExtensions: ["tsx", "ts", "jsx", "js"].filter((ext) => {
    return true;
  }),
};

if (process.env.NEXT_PUBLIC_TEMPO) {
  nextConfig["experimental"] = {
    ...nextConfig.experimental,
    // NextJS 13.4.8 up to 14.1.3:
    // swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
    // NextJS 14.1.3 to 14.2.11:
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],

    // NextJS 15+ (Not yet supported, coming soon)
  };
}

// Add a custom webpack rule to completely ignore tempobook directory
if (!nextConfig.webpack) {
  nextConfig.webpack = (config, options) => config;
}

const originalWebpack = nextConfig.webpack;
nextConfig.webpack = (config, options) => {
  const modifiedConfig = originalWebpack(config, options);

  // Add rule to ignore tempobook directory
  modifiedConfig.module = modifiedConfig.module || {};
  modifiedConfig.module.rules = modifiedConfig.module.rules || [];
  modifiedConfig.module.rules.push({
    test: /[\\/]tempobook[\\/]/,
    loader: "null-loader",
    exclude: /node_modules/,
  });

  return modifiedConfig;
};

module.exports = nextConfig;
