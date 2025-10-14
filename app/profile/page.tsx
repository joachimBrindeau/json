'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLibraryStats } from '@/hooks/use-library-stats';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { User, Mail, Calendar, FileJson, Download, LogOut, Settings, Trash2, Link2, Plus, Github, Chrome, Key } from 'lucide-react';
import { DebugAvatar } from '@/components/debug/debug-avatar';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

const isDevelopment = process.env.NODE_ENV === 'development';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { totalJsons, totalSize, loading: statsLoading } = useLibraryStats();
  const [joinedDate] = useState(new Date(2024, 0, 15)); // Placeholder
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  // Load linked accounts
  useEffect(() => {
    if (session) {
      fetchLinkedAccounts();
    }
  }, [session]);

  const fetchLinkedAccounts = async () => {
    try {
      const data = await apiClient.get<{ accounts: any[]; hasPassword: boolean }>('/api/user/accounts');
      setLinkedAccounts(data.accounts || []);
      setHasPassword(data.hasPassword || false);
    } catch (error) {
      logger.error({ err: error, userId: session?.user?.id }, 'Failed to fetch linked accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Stats are now loaded via useLibraryStats hook

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleExportData = async () => {
    try {
      // For now, export from IndexedDB (later we'll use API)
      const { indexedDBStorage } = await import('@/lib/indexed-db');
      const shares = await indexedDBStorage.getAllShares();

      const exportData = {
        user: {
          name: session?.user?.name,
          email: session?.user?.email,
          exportDate: new Date().toISOString(),
        },
        jsonDocuments: shares.map((share) => ({
          id: share.id,
          title: share.title,
          content: share.content,
          size: share.size,
          createdAt: share.createdAt.toISOString(),
        })),
        statistics: { totalJsons, totalSize, joinedDate },
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `json-viewer-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error({ err: error, totalJsons, totalSize }, 'Export data failed');
      // Could add toast notification here
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      // Call the delete account API
      await apiClient.delete('/api/auth/delete-account');

      // Sign out and redirect to home
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      logger.error({ err: error, userId: session?.user?.id }, 'Failed to delete account');
      alert('Failed to delete account. Please try again.');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <MainLayout>
      <div className="h-full overflow-auto p-6 select-none">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={session.user?.image || undefined}
                    alt={session.user?.name || 'User'}
                  />
                  <AvatarFallback className="text-lg">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{session.user?.name || 'User'}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {session.user?.email}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined{' '}
                    {joinedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
              <CardDescription>Your JSON Viewer activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : totalJsons}
                  </div>
                  <div className="text-sm text-muted-foreground">JSONs Saved</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : (totalSize / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-sm text-muted-foreground">Total Storage</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage your account and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Linked Accounts */}
              <div>
                <div className="font-medium mb-3">Authentication Methods</div>
                <div className="space-y-2">
                  {/* Email/Password */}
                  {hasPassword && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">Email &amp; Password</div>
                          <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  )}
                  
                  {/* OAuth Accounts */}
                  {linkedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {account.provider === 'github' ? (
                          <Github className="h-4 w-4 text-muted-foreground" />
                        ) : account.provider === 'google' ? (
                          <Chrome className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium text-sm capitalize">{account.provider}</div>
                          <div className="text-xs text-muted-foreground">OAuth Provider</div>
                        </div>
                      </div>
                      <Badge variant="secondary">Linked</Badge>
                    </div>
                  ))}
                  
                  {/* Add more auth methods */}
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Add more ways to sign in:
                    </div>
                    <div className="flex gap-2">
                      {!linkedAccounts.some(a => a.provider === 'github') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => signIn('github')}
                        >
                          <Github className="h-4 w-4 mr-2" />
                          Link GitHub
                        </Button>
                      )}
                      {!linkedAccounts.some(a => a.provider === 'google') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => signIn('google')}
                        >
                          <Chrome className="h-4 w-4 mr-2" />
                          Link Google
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Export */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">
                    Download all your JSONs and data
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              {/* Sign Out */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sign Out</div>
                  <div className="text-sm text-muted-foreground">Sign out of your account</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Delete Account</div>
                  <div className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Avatar Component */}
        {isDevelopment && (
          <div className="mt-6">
            <DebugAvatar />
          </div>
        )}

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Account"
          description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
          confirmText="Delete Account"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDeleteAccount}
        />
      </div>
    </MainLayout>
  );
}
