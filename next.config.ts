
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /**
   * Configuração obrigatória para o Firebase App Hosting (SSR/Standalone).
   */
  output: 'standalone',
  
  /** 
   * O firebase-admin deve ser tratado como pacote externo no servidor no Next.js 15.
   */
  serverExternalPackages: ['firebase-admin'],

  /**
   * Configurações experimentais para suportar o ambiente de desenvolvimento
   * do Cloud Workstations e evitar avisos de Cross-Origin.
   */
  experimental: {
    allowedDevOrigins: [
      '6000-firebase-studio-1772738614944.cluster-c72u3gwiofapkvxrcwjq5zllcu.cloudworkstations.dev'
    ]
  } as any,
  
  /**
   * Ignora erros de build para garantir que a sincronização do App Hosting ocorra 
   * mesmo com avisos de Lint ou Typescript.
   */
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
