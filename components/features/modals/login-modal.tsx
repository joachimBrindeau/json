'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Github, Chrome, LogIn, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: 'library' | 'save' | 'share' | 'expire' | 'general' | 'publish' | 'saved';
}

const contextMessages = {
  library: {
    title: 'Access Your Library',
    description: 'Sign in to view and manage your saved JSONs',
  },
  save: {
    title: 'Save to Library',
    description: 'Sign in to save this JSON permanently to your library',
  },
  share: {
    title: 'Share Permanently',
    description: 'Sign in to create permanent share links that never expire',
  },
  expire: {
    title: 'Save Before It Expires',
    description: 'This JSON will expire soon. Sign in to save it permanently',
  },
  general: {
    title: 'Sign in to JSON Viewer',
    description: 'Sign in to save your JSONs permanently and access advanced features',
  },
  publish: {
    title: 'Publish to Community',
    description: 'Sign in to publish your JSON to the public community library',
  },
  saved: {
    title: 'Access Saved JSONs',
    description: 'Sign in to view and manage your saved JSON files',
  },
};

export function LoginModal({ open, onOpenChange, context = 'general' }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { toast } = useToast();
  const message = contextMessages[context];

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider);
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: `Failed to sign in with ${provider}`,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (isSignup) {
        // Create account
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim() || 'User',
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create account');
        }

        // Sign in after successful signup
        const signInResult = await signIn('credentials', {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error('Account created but sign in failed. Please try signing in.');
        }

        toast({
          title: 'Welcome!',
          description: 'Account created successfully',
        });
        onOpenChange(false);
        window.location.reload();
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        toast({
          title: 'Welcome back!',
          description: 'Signed in successfully',
        });
        onOpenChange(false);
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: isSignup ? 'Signup failed' : 'Sign in failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            {isSignup ? 'Create Account' : message.title}
          </DialogTitle>
          <DialogDescription>
            {isSignup ? 'Create a new account to get started' : message.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  className="pl-9"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-9"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-9 pr-9"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignup(!isSignup)}
              disabled={isLoading}
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading}
          >
            <Github className="w-4 h-4 mr-2" />
            Continue with GitHub
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
          >
            <Chrome className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Continue without signing in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}