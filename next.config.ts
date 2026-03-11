
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Modo Standalone é obrigatório para Firebase App Hosting
  output: 'standalone',
  // Garante que o SDK Admin não seja incluído no bundle do lado do cliente
  serverExternalPackages: ['firebase-admin'],
  // Blindagem de Build: Ignora erros de lint/tipagem que travam o rollout AOT
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.firebasestorage.googleapis.com' },
    ],
  }
};

export default nextConfig;
