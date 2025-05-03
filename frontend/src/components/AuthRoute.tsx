
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthRouteProps {
  children: React.ReactNode;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("AuthRoute - user:", user, "isLoading:", isLoading);
  }, [user, isLoading]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center">
        <Skeleton className="h-[200px] w-full max-w-4xl rounded-lg mb-4" />
        <div className="space-y-2 w-full max-w-4xl">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log("No user found, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

export default AuthRoute;
