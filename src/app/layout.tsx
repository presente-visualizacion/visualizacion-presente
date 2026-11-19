import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/figtree';
// Tipos de letra que se pueden elegir para las diapositivas (src/lib/fuentes.ts).
// El navegador solo descarga los archivos de la que se use.
import '@fontsource-variable/inter';
import '@fontsource-variable/montserrat';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import '@fontsource-variable/open-sans';
import '@fontsource-variable/roboto';
import '@fontsource-variable/nunito';
import '@fontsource-variable/raleway';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/merriweather';
import '@fontsource-variable/lora';
import '@fontsource-variable/playfair-display';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Visualización Presente', template: '%s | Visualización Presente' },
  description: 'Herramienta para crear y presentar informes con datos por mes.',
  // Herramienta interna: que los buscadores no la listen.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#D4145A' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
