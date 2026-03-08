import type {Metadata} from 'next';
import './globals.css';
import { NavigationGuard } from '@/components/layout/NavigationGuard';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Recompor+',
  description: 'Diário de classe moderno para professores de Português e Matemática',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <NavigationGuard />
          {children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
