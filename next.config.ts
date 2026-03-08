import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Configuração obrigatória para o Firebase App Hosting (SSR/Standalone) */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    /**
     * Permite conexões HMR do ambiente de desenvolvimento do Firebase Studio (Cloud Workstations).
     * Isso evita que o Next.js recuse a conexão por diferença de origem e cause reinícios do servidor.
     */
    allowedDevOrigins: ['*.cloudworkstations.dev', '*.googleusercontent.com'],
  },
  images: {
    /* Mantido como não otimizado para evitar dependência de bibliotecas de imagem no servidor standalone */
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
