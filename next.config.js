/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL,
  },
};

module.exports = nextConfig;
