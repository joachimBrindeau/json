'use client';

import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export function DebugAvatar() {
  const { data: session, status } = useSession();
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoadSuccess, setImageLoadSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  useEffect(() => {
    setImageLoadError(false);
    setImageLoadSuccess(false);
  }, [session?.user?.image]);

  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  if (!session?.user) {
    return <div>No user session</div>;
  }

  const user = session.user;

  const refreshProfile = async () => {
    setRefreshing(true);
    setRefreshResult(null);

    try {
      const response = await fetch('/api/user/refresh-profile', {
        method: 'POST',
      });

      const result = await response.json();
      setRefreshResult(result);

      if (result.updated) {
        // Force session refresh
        window.location.reload();
      }
    } catch (error) {
      setRefreshResult({ error: 'Failed to refresh profile' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Profile Picture Debug
          {user.image && (
            <Badge variant={imageLoadSuccess ? 'default' : imageLoadError ? 'destructive' : 'secondary'}>
              {imageLoadSuccess ? 'Loaded' : imageLoadError ? 'Failed' : 'Loading'}
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={refreshProfile}
            disabled={refreshing}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Profile'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || 'User'}
              onLoad={() => setImageLoadSuccess(true)}
              onError={() => setImageLoadError(true)}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
              {user.name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Debug Information */}
        <div className="space-y-2 text-sm">
          <div>
            <strong>User ID:</strong> {user.id || 'Not available'}
          </div>
          <div>
            <strong>Name:</strong> {user.name || 'Not available'}
          </div>
          <div>
            <strong>Email:</strong> {user.email || 'Not available'}
          </div>
          <div>
            <strong>Image URL:</strong> 
            {user.image ? (
              <div className="mt-1">
                <code className="bg-muted p-1 rounded text-xs break-all">
                  {user.image}
                </code>
              </div>
            ) : (
              <span className="text-muted-foreground"> Not available</span>
            )}
          </div>
        </div>

        {/* Test Direct Image Load */}
        {user.image && (
          <div className="space-y-2">
            <strong className="text-sm">Direct Image Test:</strong>
            <div className="border rounded p-2">
              <img
                src={user.image}
                alt="Direct load test"
                className="h-16 w-16 rounded-full object-cover"
                onLoad={() => console.log('Direct image load success')}
                onError={(e) => {
                  console.error('Direct image load failed:', e);
                  console.log('Failed URL:', user.image);
                }}
              />
            </div>
          </div>
        )}

        {/* Test with Different Sizes */}
        {user.image && (
          <div className="space-y-2">
            <strong className="text-sm">Different Sizes Test:</strong>
            <div className="flex gap-2">
              {[32, 64, 128, 256].map(size => (
                <div key={size} className="text-center">
                  <img
                    src={user.image.replace(/=s\d+/, `=s${size}`)}
                    alt={`${size}px test`}
                    className="rounded-full object-cover border"
                    style={{ width: `${Math.min(size, 64)}px`, height: `${Math.min(size, 64)}px` }}
                    onError={(e) => console.error(`Size ${size} failed:`, e)}
                  />
                  <div className="text-xs text-muted-foreground">{size}px</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Result */}
        {refreshResult && (
          <div className="space-y-2">
            <strong className="text-sm">Refresh Result:</strong>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(refreshResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Session Debug */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Raw Session Data</summary>
          <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
