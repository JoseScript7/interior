import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Nav } from '@/components/Nav';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'DesignAI — AI Interior Visualization',
  description: 'Upload a room photo, get AI design recommendations, visualize real furniture in 3D and AR, and shop the look.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
