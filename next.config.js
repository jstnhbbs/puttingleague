/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // For GitHub Pages, set basePath if your repo name is not the root
  // basePath: '/puttingleague',
  // assetPrefix: '/puttingleague/',
}

module.exports = nextConfig
