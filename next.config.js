/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      $lib: require('path').resolve(__dirname, 'src/lib')
    };
    return config;
  }
};

module.exports = nextConfig;
