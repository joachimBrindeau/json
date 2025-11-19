'use client';

/**
 * LoginModal Component
 * 
 * Complex authentication modal with login/signup tabs and OAuth providers.
 * 
 * **Note:** This modal intentionally uses Dialog directly instead of BaseModal because:
 * - It has complex tab-based navigation (login/signup)
 * - It requires custom footer with OAuth buttons and form switching
 * - The structure is significantly different from standard modals
 * - BaseModal's footer actions pattern doesn't fit this use case
 * 
 * For simpler modals, prefer BaseModal for consistency.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormInput } from '@/components/shared/FormFields';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Github, Chrome, LogIn, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { normalizeEmail } from '@/lib/utils/email';
import type { SignupFormData } from '@/lib/auth/types';
import { LOGIN_CONTEXT_MESSAGES, AUTH_ERROR_MESSAGES } from '@/lib/auth/constants';
import { PasswordStrengthIndicator } from '@/components/shared/PasswordStrengthIndicator';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: 'library' | 'save' | 'share' | 'expire' | 'general' | 'publish';
}

export function LoginModal({ open, onOpenChange, context = 'general' }: LoginModalProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
  });

  const { toast } = useToast();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const message = LOGIN_CONTEXT_MESSAGES[context] || LOGIN_CONTEXT_MESSAGES.general;

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setIsOAuthLoading(true);
    
    try {
      // OAuth requires a redirect, so we don't await this
      // The redirect will happen immediately
      // OAuth errors after redirect will be handled by NextAuth error pages
      await signIn(provider, {
        redirect: true,
        callbackUrl: window.location.href,
      });
    } catch (error) {
      // Only catch errors that happen before redirect
      // OAuth errors after redirect will be handled by NextAuth error pages
      logger.error({ err: error, provider }, `Failed to initiate OAuth sign in`);
      setIsOAuthLoading(false);
      toast({
        title: 'Sign in failed',
        description: `Failed to start sign in with ${provider}. Please try again.`,
        variant: 'destructive',
      });
    }
    // Note: Don't reset loading state here - redirect will happen
    // If redirect fails, error handler above will reset it
  };

  const { submit: submitForm, isSubmitting: isLoading } = useFormSubmit(
    async () => {
      if (!formData.email || !formData.password) {
        throw new Error(AUTH_ERROR_MESSAGES.MISSING_CREDENTIALS);
      }

      const email = normalizeEmail(formData.email);

      if (isSignup) {
        // Create account
        await apiClient.post('/api/auth/signup', {
          name: formData.name?.trim() || 'User',
          email,
          password: formData.password,
        });

        // Sign in after successful signup
        const signInResult = await signIn('credentials', {
          email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error('Account created but sign in failed. Please try signing in.');
        }
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
      }
    },
    {
      onSuccess: async () => {
        toast({
          title: isSignup ? 'Welcome!' : 'Welcome back!',
          description: isSignup ? 'Account created successfully' : 'Signed in successfully',
        });

        onOpenChange(false);

        // DRY KISS SOLID: Combine SessionProvider update with router refresh
        // updateSession() triggers client-side SessionProvider refetch
        // router.refresh() triggers server component revalidation
        // Together they ensure complete session synchronization
        await updateSession();
        router.refresh();
      },
      onError: (error) => {
        logger.error(
          { err: error, email: formData.email, isSignup },
          isSignup ? 'Failed to create account' : 'Failed to sign in'
        );
        toast({
          title: isSignup ? 'Signup failed' : 'Sign in failed',
          description: error.message || 'Something went wrong',
          variant: 'destructive',
        });
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(undefined);
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
            <div className="relative">
              <User className="absolute left-3 top-9 h-4 w-4 text-muted-foreground z-10" />
              <FormInput
                id="name"
                label="Name (optional)"
                type="text"
                placeholder="Your name"
                className="pl-9"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground z-10" />
            <FormInput
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              className="pl-9"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground z-10" />
            <FormInput
              id="password"
              label="Password"
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
              className="absolute right-3 top-9 z-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength Indicator (only show during signup) */}
          {isSignup && formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}

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
            disabled={isLoading || isOAuthLoading}
          >
            <Github className="w-4 h-4 mr-2" />
            Continue with GitHub
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading || isOAuthLoading}
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
