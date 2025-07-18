import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilita source maps para debug
  productionBrowserSourceMaps: true,

  // Configurações para development
  experimental: {
    // Habilita debugging no lado do servidor
    serverComponentsExternalPackages: [],
  },

  // Configurações do webpack para debug
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Melhora os source maps para debug
      config.devtool = "eval-source-map";

      // Configurações para debugging no servidor
      if (isServer) {
        config.optimization.minimize = false;
      }
    }

    return config;
  },

  // Configurações para o servidor de desenvolvimento
  async rewrites() {
    return [];
  },
};

export default nextConfig;
