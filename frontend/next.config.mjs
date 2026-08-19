/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any source during development
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable trailing slashes for cleaner URLs
  trailingSlash: true,
  // Fix Watchpack EINVAL errors on Windows
  // Prevents Next.js from scanning system files like pagefile.sys, hiberfil.sys
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/pagefile.sys',
        '**/hiberfil.sys',
        '**/swapfile.sys',
        '**/DumpStack.log.tmp',
      ],
    };
    return config;
  },
};

export default nextConfig;
