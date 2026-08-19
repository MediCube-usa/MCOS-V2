import './globals.css';
import type { ReactNode } from 'react';
import { MapBackdrop } from '@/components/MapBackdrop';

export const metadata = {
  title: 'MCOS — Command Center',
  description: 'MediCube Operating System — national command dashboard'
};

// Build stamp — always visible bottom-right so there is never a question of
// which version of the site the browser is showing.
const BUILD = `${(process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MapBackdrop />
        {children}
        <div className="build-stamp" title="site version — changes with every update">v-{BUILD}</div>
      </body>
    </html>
  );
}
