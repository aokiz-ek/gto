/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gto/core', '@gto/ui'],
  // Enable static export for H5 deployment
  // output: 'export',
};

module.exports = nextConfig;
