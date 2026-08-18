import './globals.css';
import type { ReactNode } from 'react';
import { MapBackdrop } from '@/components/MapBackdrop';

export const metadata = {
  title: 'MCOS — Command Center',
  description: 'MediCube Operating System — national command dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MapBackdrop />
        {children}
      </body>
    </html>
  );
}
