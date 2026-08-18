import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'MCOS V2 — Command Center',
  description: 'MediCube Operating System — national command dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
