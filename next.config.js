/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // basePath: '/',

  webpack: config => {
    config.resolve.fallback = { ...config.resolve.fallback, net: false, os: false };
    return config;
  },

  env: {
    REDIS_URL: process.env.REDIS_URL,
    MYSQL_HOST: '127.0.0.1',
    MYSQL_DATABASE: 'hmi',
    MYSQL_USER: 'root'
  },
}

module.exports = nextConfig
