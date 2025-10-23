'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw } from 'lucide-react';

interface SEOSettings {
  id: string;
  pageKey: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  isActive: boolean;
  priority: number;
  updatedAt: Date;
}

export default function SEOAdminPage() {
  const [settings, setSettings] = useState<SEOSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const loadSEOSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<{ settings: SEOSettings[] }>('/api/admin/seo');
      setSettings(data.settings || []);
    } catch (error) {
      logger.error({ err: error }, 'Failed to load SEO settings');
      toast({
        title: 'Error',
        description: 'Failed to load SEO settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSEOSettings();
  }, [loadSEOSettings]);

  const updateSEOSetting = async (pageKey: string, data: Partial<SEOSettings>) => {
    try {
      setSaving(pageKey);
      await apiClient.post('/api/admin/seo', { pageKey, ...data });

      toast({
        title: 'Success',
        description: `SEO settings updated for ${pageKey}`,
      });
      loadSEOSettings(); // Reload to get updated data
    } catch (error) {
      logger.error({ err: error, pageKey }, 'Failed to update SEO settings');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update SEO settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = (
    index: number,
    field: keyof SEOSettings,
    value: SEOSettings[keyof SEOSettings]
  ) => {
    setSettings((prev) =>
      prev.map((setting, i) => (i === index ? { ...setting, [field]: value } : setting))
    );
  };

  const handleKeywordsUpdate = (index: number, keywordsStr: string) => {
    const keywords = keywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    handleUpdate(index, 'keywords', keywords);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading SEO settings...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SEO Management</h1>
            <p className="text-muted-foreground">Manage page-specific SEO settings</p>
          </div>
          <Button onClick={loadSEOSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {settings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No SEO settings found. Database may not be initialized.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Run the seed script: <code>npx tsx scripts/seed-seo.ts</code>
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {settings.map((setting, index) => (
              <Card key={setting.pageKey} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold capitalize">{setting.pageKey}</h2>
                    <Badge variant={setting.isActive ? 'default' : 'secondary'}>
                      {setting.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">Priority: {setting.priority}</Badge>
                  </div>
                  <Button
                    onClick={() => updateSEOSetting(setting.pageKey, setting)}
                    disabled={saving === setting.pageKey}
                    size="sm"
                  >
                    {saving === setting.pageKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Title ({setting.title.length}/200)
                    </label>
                    <Input
                      value={setting.title}
                      onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                      maxLength={200}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Description ({setting.description.length}/500)
                    </label>
                    <Textarea
                      value={setting.description}
                      onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Keywords (comma-separated)</label>
                    <Input
                      value={setting.keywords.join(', ')}
                      onChange={(e) => handleKeywordsUpdate(index, e.target.value)}
                      placeholder="json, editor, formatter, validator"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {setting.keywords.length}/20 keywords
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">OG Image</label>
                    <Input
                      value={setting.ogImage || ''}
                      onChange={(e) => handleUpdate(index, 'ogImage', e.target.value)}
                      placeholder="/og-image.png"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`active-${setting.pageKey}`}
                        checked={setting.isActive}
                        onChange={(e) => handleUpdate(index, 'isActive', e.target.checked)}
                      />
                      <label htmlFor={`active-${setting.pageKey}`} className="text-sm font-medium">
                        Active
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor={`priority-${setting.pageKey}`}
                        className="text-sm font-medium"
                      >
                        Priority:
                      </label>
                      <Input
                        id={`priority-${setting.pageKey}`}
                        type="number"
                        min="1"
                        max="100"
                        value={setting.priority}
                        onChange={(e) => handleUpdate(index, 'priority', parseInt(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(setting.updatedAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
