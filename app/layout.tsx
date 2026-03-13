import type { ReactNode } from 'react';
import NavBar from '@/components/NavBar';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const metadata = {
  title: 'Kuni Clock — Study Timer',
  description: 'Track your study sessions by subject with detailed analytics.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-primary font-sans">
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(168,85,247,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <header className="sticky top-0 z-50 border-b border-border-subtle bg-glass-nav backdrop-blur-md">
              <NavBar />
            </header>
            <div className="relative z-[1]">{children}</div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
