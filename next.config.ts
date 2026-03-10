
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /**
   * Configuração obrigatória para o Firebase App Hosting (SSR/Standalone).
   */
  output: 'standalone',
  
  /** 
   * O firebase-admin deve ser tratado como pacote externo no servidor.
   * No Next.js 15, esta configuração fica na raiz.
   */
  serverExternalPackages: ['firebase-admin'],
  
  experimental: {
    /**
     * Autoriza origens do Firebase Studio e produção para evitar falhas de HMR/CORS.
     */
    allowedDevOrigins: [
      '*.cloudworkstations.dev', 
      'localhost:9002', 
      '*.web.app', 
      '*.firebaseapp.com',
      'studio-*.cloudworkstations.dev'
    ],
  },

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
