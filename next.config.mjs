import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js"

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

const config = (phase) => ({
  ...nextConfig,
  // Build e dev podem rodar juntos sem sobrescrever seus chunks.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
})

export default config
