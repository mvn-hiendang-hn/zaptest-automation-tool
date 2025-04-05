import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BarChart3, 
  Calendar, 
  FolderKanban, 
  LogOut, 
  Terminal, 
  User
} from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
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
              className="h-6 w-6 text-primary"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M4 8h16" />
              <path d="M4 12h16" />
              <path d="M4 16h16" />
            </svg>
            <span className="font-bold text-xl">API Tracker</span>
          </Link>
          
          <nav className="hidden md:flex ml-10 space-x-4">
            <Link 
              to="/" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Terminal className="h-4 w-4 mr-2" />
              Test API
            </Link>
            <Link 
              to="/collections" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/collections') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <FolderKanban className="h-4 w-4 mr-2" />
              Collections
            </Link>
            <Link 
              to="/schedules" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/schedules') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedules
            </Link>
            <Link 
              to="/history" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/history') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              History
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || "User"} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="md:hidden border-t">
        <nav className="flex justify-between px-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center py-2 flex-1 text-xs ${
              isActive('/') 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <Terminal className="h-5 w-5 mb-1" />
            Test
          </Link>
          <Link 
            to="/collections" 
            className={`flex flex-col items-center py-2 flex-1 text-xs ${
              isActive('/collections') 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <FolderKanban className="h-5 w-5 mb-1" />
            Collections
          </Link>
          <Link 
            to="/schedules" 
            className={`flex flex-col items-center py-2 flex-1 text-xs ${
              isActive('/schedules') 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            Schedules
          </Link>
          <Link 
            to="/history" 
            className={`flex flex-col items-center py-2 flex-1 text-xs ${
              isActive('/history') 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <BarChart3 className="h-5 w-5 mb-1" />
            History
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
