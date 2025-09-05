import React from 'react';
import { Button } from './Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { NotificationDropdown } from './NotificationDropdown';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
  showBackButton?: boolean;
}

export function PageHeader({ title, onBack, children, showBackButton = true }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between py-6 px-10 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl mb-8">
      <div className="flex items-center space-x-4">
        {showBackButton && onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Button>
        )}
        <h1 className="text-3xl font-extrabold text-gray-700 tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationDropdown />
        {children}
      </div>
    </header>
  );
}
