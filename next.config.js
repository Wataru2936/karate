/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/karate',
  assetPrefix: '/karate',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 