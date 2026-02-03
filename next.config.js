/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages; omit for Vercel (so API routes work)
  ...(process.env.GITHUB_PAGES === '1' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  // For GitHub Pages, set basePath if your repo name is not the root
  // basePath: '/puttingleague',
  // assetPrefix: '/puttingleague/',
}

module.exports = nextConfig
