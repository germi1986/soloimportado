import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solo Importado Mayorista',
  description: 'Portal mayorista privado'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
