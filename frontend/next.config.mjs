/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // MetaMask SDK and WalletConnect pull in optional native/Node modules that
    // don't exist in a browser/Edge runtime — stub them out so the build passes.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

export default nextConfig
