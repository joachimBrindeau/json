'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserList } from './UserList';
import { TagAnalytics } from './TagAnalytics';
import { SystemStats } from './SystemStats';
import { SEOManager } from './SeoManager';
import { useAdminStats } from '@/hooks/use-admin-stats';

export function SuperAdminDashboard() {
  const { stats, loading, error } = useAdminStats();

  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm">
            Users
          </TabsTrigger>
          <TabsTrigger value="tags" className="text-xs md:text-sm">
            Tags
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs md:text-sm">
            SEO
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs md:text-sm">
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="m22 21-3-3m0 0L16 21" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading
                    ? 'Loading...'
                    : error
                      ? 'Error'
                      : (stats?.userCount ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Registered accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading
                    ? 'Loading...'
                    : error
                      ? 'Error'
                      : (stats?.documentCount ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">JSON documents saved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tags Created</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading
                    ? 'Loading...'
                    : error
                      ? 'Error'
                      : (stats?.tagCount ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total tags in use</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading
                    ? 'Loading...'
                    : error
                      ? 'Error'
                      : (stats?.activeToday ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Users active today</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user actions and document changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">New user registration</p>
                      <p className="text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">Document shared publicly</p>
                      <p className="text-muted-foreground">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">
                        New tag created: &quot;api-schema&quot;
                      </p>
                      <p className="text-muted-foreground">12 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Application performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Connection</span>
                    <span className="text-sm text-green-600 font-medium">✓ Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Redis Cache</span>
                    <span className="text-sm text-green-600 font-medium">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Response Time</span>
                    <span className="text-sm text-green-600 font-medium">145ms avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-green-600 font-medium">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage registered users and view activity</CardDescription>
            </CardHeader>
            <CardContent>
              <UserList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tag Analytics</CardTitle>
              <CardDescription>Tag usage statistics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <TagAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Management</CardTitle>
              <CardDescription>Manage site SEO settings and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <SEOManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
              <CardDescription>System configuration and maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
