'use client';

import { useEffect, useState } from 'react';
import { BaseModal } from '@/components/shared/BaseModal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Calendar,
  FileJson,
  Eye,
  HardDrive,
  Tag,
  CheckCircle2,
  XCircle,
  Github,
  Chrome,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { showApiErrorToast } from '@/lib/utils/toast-helpers';

interface UserAccount {
  provider: string;
  providerAccountId: string;
  type: string;
}

interface UserStatistics {
  totalDocuments: number;
  publicDocuments: number;
  privateDocuments: number;
  totalSize: number;
  totalViews: number;
  uniqueTags: number;
  activeSessions: number;
}

interface RecentDocument {
  id: string;
  title: string;
  visibility: string;
  views: number;
  size: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserDetails {
  id: string;
  name?: string;
  email: string;
  emailVerified?: string | null;
  image?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  accounts: UserAccount[];
  statistics: UserStatistics;
  recentDocuments: RecentDocument[];
  tags: string[];
}

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function UserDetailsModal({ open, onOpenChange, userId }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!open || !userId) return;

      try {
        setLoading(true);
        const data = await apiClient.get<{ user: UserDetails }>(`/api/admin/users/${userId}`);
        setUser(data.user);
      } catch (error) {
        logger.error({ err: error, userId }, 'Failed to fetch user details');
        showApiErrorToast('Failed to load user details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [open, userId]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'google':
        return <Chrome className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="User Details"
      description="Comprehensive information about the user and their activity"
      icon={<User className="h-5 w-5" />}
      className="sm:max-w-3xl"
      maxHeight="90vh"
      showFooter={false}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Failed to load user details</p>
        </div>
      ) : (
        <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || user.email}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xl font-medium">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{user.name || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <div className="font-medium flex items-center gap-2">
                        {user.email}
                        {user.emailVerified ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Registered
                    </div>
                    <div className="font-medium">{format(new Date(user.createdAt), 'PPP')}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last Login
                    </div>
                    <div className="font-medium">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'PPP') : 'Never'}
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OAuth Accounts */}
            {user.accounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connected Accounts</CardTitle>
                  <CardDescription>OAuth providers linked to this account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {user.accounts.map((account, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                      >
                        {getProviderIcon(account.provider)}
                        <div className="flex-1">
                          <div className="font-medium capitalize">{account.provider}</div>
                          <div className="text-xs text-muted-foreground">
                            Account ID: {account.providerAccountId}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {account.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Documents
                    </div>
                    <div className="text-2xl font-bold">{user.statistics.totalDocuments}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.statistics.publicDocuments} public, {user.statistics.privateDocuments}{' '}
                      private
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Total Views
                    </div>
                    <div className="text-2xl font-bold">{user.statistics.totalViews}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Storage Used
                    </div>
                    <div className="text-2xl font-bold">
                      {formatBytes(user.statistics.totalSize)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Unique Tags
                    </div>
                    <div className="text-2xl font-bold">{user.statistics.uniqueTags}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Documents */}
            {user.recentDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Documents</CardTitle>
                  <CardDescription>Latest {user.recentDocuments.length} documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.recentDocuments.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-md border space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Updated{' '}
                              {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </div>
                          </div>
                          <Badge variant={doc.visibility === 'public' ? 'default' : 'secondary'}>
                            {doc.visibility}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {doc.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatBytes(doc.size)}
                          </span>
                          {doc.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {doc.tags.length} tags
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {user.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags Used ({user.tags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      )}
    </BaseModal>
  );
}
