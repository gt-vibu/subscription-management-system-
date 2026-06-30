import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive animate-bounce">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">403 - Access Denied</h1>
        <p className="text-muted-foreground leading-relaxed">
          You do not have the required role privileges or permission policies to access this restricted page.
        </p>
      </div>
      <Link to="/dashboard">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default Unauthorized;
