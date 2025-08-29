/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
    swcTraceProfiling: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Отключаем SWC полностью
  compiler: {
    removeConsole: false,
  },
}

module.exports = nextConfig
