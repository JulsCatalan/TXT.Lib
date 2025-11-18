// src/app/auth/layout.tsx

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
