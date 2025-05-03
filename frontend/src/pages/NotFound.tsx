
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="glass-panel p-8 rounded-xl border max-w-md w-full text-center animate-fade-in">
        <div className="bg-primary/10 mx-auto h-16 w-16 flex items-center justify-center rounded-full mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-foreground mb-6">Page not found</p>
        <p className="text-muted-foreground mb-8">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        
        <Button onClick={() => navigate("/")} size="lg" className="transition-all duration-300">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
