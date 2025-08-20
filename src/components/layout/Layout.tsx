import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [collapsed, setCollapsed] = useState(false);
  
  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar with conditional rendering based on mobile state */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full z-40",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          !collapsed ? "w-56" : "w-16",
          isMobile ? "fixed" : "relative"
        )}
      >
        <Sidebar 
          onCloseSidebar={() => isMobile && setSidebarOpen(false)} 
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>
      
      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
      )}>
        <Navbar 
          onMenuClick={toggleSidebar} 
          showMenuButton={isMobile}
          collapsed={collapsed}
          toggleSidebar={toggleCollapsed}
        />
        <main className={cn(
          "flex-1 overflow-auto transition-all animate-fade-in",
          isMobile ? "p-3" : "p-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
