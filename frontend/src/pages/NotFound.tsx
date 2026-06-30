import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HelpCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
      <div className="rounded-full bg-muted p-4 text-muted-foreground animate-pulse">
        <HelpCircle className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
        <p className="text-muted-foreground leading-relaxed">
          The link you followed may be broken, or the page was archived/deleted.
        </p>
      </div>
      <Link to="/">
        <Button>Return to Catalog</Button>
      </Link>
    </div>
  );
};

export default NotFound;
