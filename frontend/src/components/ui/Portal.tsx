"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  className?: string;
}

export function Portal({ children, className = '' }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  // Create a portal container if it doesn't exist
  let portalContainer = document.getElementById('portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'portal-root';
    portalContainer.style.position = 'fixed';
    portalContainer.style.top = '0';
    portalContainer.style.left = '0';
    portalContainer.style.width = '100vw';
    portalContainer.style.height = '100vh';
    portalContainer.style.pointerEvents = 'none';
    portalContainer.style.zIndex = '999999';
    document.body.appendChild(portalContainer);
  }

  return createPortal(
    <div className={className} style={{ pointerEvents: 'auto' }}>
      {children}
    </div>,
    portalContainer
  );
}
