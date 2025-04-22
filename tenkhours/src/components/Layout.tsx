import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
} 