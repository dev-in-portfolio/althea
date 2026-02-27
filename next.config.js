import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      $lib: path.join(process.cwd(), 'src/lib')
    };
    return config;
  }
};

export default nextConfig;
