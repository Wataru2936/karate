/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/karate',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 