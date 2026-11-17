import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/figtree';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Visualización Presente', template: '%s | Visualización Presente' },
  description: 'Herramienta para crear y presentar informes con datos por mes.',
};

export const viewport: Viewport = { themeColor: '#D4145A' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
