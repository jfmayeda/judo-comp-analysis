import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SV Judo - Competitor Analysis',
  description: 'Coach scouting notes and tournament-day profiles',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
