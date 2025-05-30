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
  // Explicitly tell Next.js to ignore these directories
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/tempobook/**", "**/node_modules/**"],
    };
    return config;
  },
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

module.exports = nextConfig;
