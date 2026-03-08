
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /**
   * Configuração obrigatória para o Firebase App Hosting (SSR/Standalone).
   * Isso gera o bundle otimizado para produção no diretório .next/standalone.
   */
  output: 'standalone',
  
  experimental: {
    /** 
     * O firebase-admin deve ser tratado como pacote externo no servidor para evitar 
     * erros de "clientReferenceManifest" no Next.js 15.
     */
    serverExternalPackages: ['firebase-admin'],
    /**
     * Autoriza explicitamente as origens do Firebase Studio para o Hot Reload (HMR).
     */
    allowedDevOrigins: ['*.cloudworkstations.dev', 'localhost:9002'],
  },

  typescript: {
    /** Ignoramos erros de tipo no build para acelerar o deploy no Firebase Studio */
    ignoreBuildErrors: true,
  },
  
  eslint: {
    /** Ignoramos o lint no build para evitar falhas por avisos de estilo */
    ignoreDuringBuilds: true,
  },
  
  images: {
    /** 
     * Mantido como unoptimized para evitar dependências de bibliotecas nativas de imagem 
     * no ambiente de runtime do App Hosting.
     */
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
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
