import type { Metadata } from 'next';
import { Michroma, Archivo, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const archivo = Archivo({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const sourceSans3 = Source_Sans_3({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Silicon Valley Judo - Competitor Analysis',
  description: 'Coach scouting notes and tournament-day profiles',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${michroma.variable} ${archivo.variable} ${sourceSans3.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
