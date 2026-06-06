'use client';

import React, { createContext, useContext, useState } from 'react';
import { SessionProvider } from 'next-auth/react';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <SessionProvider>
      <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
        {children}
      </SidebarContext.Provider>
    </SessionProvider>
  );
}
