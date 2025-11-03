'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Settings,
  LogOut,
  LogIn,
  Database,
  BarChart,
  HelpCircle,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/hooks/use-login-modal';
import { useState, useEffect } from 'react';
import { checkSuperAdmin } from '@/lib/auth/admin';

export function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openModal } = useLoginModal();
  const [darkMode, setDarkMode] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check and sync dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // Check superadmin status
  useEffect(() => {
    if (session?.user?.email) {
      setIsSuperAdmin(checkSuperAdmin(session.user.email));
    }
  }, [session]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (status === 'loading') {
    return (
      <div
        className="h-9 w-9 rounded-full bg-muted animate-pulse"
        data-testid="user-menu-loading"
      />
    );
  }

  if (!session) {
    return (
      <Button
        variant="green"
        size="xs"
        icon={LogIn}
        text="Sign in"
        onClick={() => openModal('general')}
        className="select-none transition-all duration-200 hover:scale-105"
        data-testid="sign-in-button"
      />
    );
  }

  // Get user initials for fallback avatar
  const getUserInitials = () => {
    const name = session.user?.name || session.user?.email || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
          data-testid="user-menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={session.user?.image || undefined}
              alt={session.user?.name || 'User'}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground text-xs font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Navigation items */}
        <DropdownMenuItem onClick={() => router.push('/private')}>
          <Database className="mr-2 h-4 w-4" />
          My Library
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <Settings className="mr-2 h-4 w-4" />
          Profile & Settings
        </DropdownMenuItem>

        {/* Superadmin only */}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/superadmin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span className="font-medium">Superadmin</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Theme toggle */}
        <DropdownMenuItem onClick={toggleDarkMode}>
          {darkMode ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Dark mode
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/blog')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Docs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
