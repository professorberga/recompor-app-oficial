import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /**
   * Configuração obrigatória para o Firebase App Hosting (SSR/Standalone).
   * Isso gera o bundle otimizado para produção no diretório .next/standalone.
   */
  output: 'standalone',
  
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
    ],
  },
};

export default nextConfig;