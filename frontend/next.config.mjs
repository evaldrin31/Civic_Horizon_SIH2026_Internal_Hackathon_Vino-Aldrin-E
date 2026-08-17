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
};

export default nextConfig;
