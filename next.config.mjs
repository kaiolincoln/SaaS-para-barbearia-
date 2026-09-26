/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14 usa ESLint legado internamente; npm run build executa o flat config antes.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
    ],
  },
}

export default nextConfig
