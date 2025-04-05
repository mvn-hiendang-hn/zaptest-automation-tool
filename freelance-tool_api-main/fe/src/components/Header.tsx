import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import EditProfileDialog from '@/components/EditProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  
  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      setDisplayName(data?.display_name || null);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);
  
  return (
    <header className={cn(
      "w-full px-6 py-4 border-b backdrop-blur-sm bg-white/90 dark:bg-black/50 z-10 transition-all duration-300",
      className
    )}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-primary-foreground"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M4 8h16" />
              <path d="M4 12h16" />
              <path d="M4 16h16" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">API Tracker</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 text-xs rounded-full bg-secondary dark:bg-secondary/30 text-muted-foreground">
            <span className="font-medium">Beta</span>
          </div>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User size={16} />
                  <span className="max-w-[100px] truncate">
                    {displayName || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="w-full cursor-default">
                    <EditProfileDialog onProfileUpdate={fetchProfileData} />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
