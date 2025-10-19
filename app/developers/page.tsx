'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, FileJson, Globe, Key, Zap } from 'lucide-react';

export default function DevelopersPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Developer Documentation</h1>
            <p className="text-xl text-muted-foreground">
              API documentation and integration guides for JSON Viewer
            </p>
          </div>

          {/* API Overview */}
          <Card data-testid="api-docs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                API Overview
              </CardTitle>
              <CardDescription>
                RESTful API endpoints for programmatic access to JSON Viewer features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health Check */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Health Check
                </h3>
                <p className="text-sm text-muted-foreground">Check API availability and status</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}</code>
                </pre>
              </div>

              {/* Library API */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public Library
                </h3>
                <p className="text-sm text-muted-foreground">Browse and search public JSON documents</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`GET /api/library?page=1&limit=20&search=example

Response:
{
  "documents": [
    {
      "id": "abc123",
      "title": "Example JSON",
      "shareId": "xyz789",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}`}</code>
                </pre>
              </div>

              {/* JSON Document API */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON Documents
                </h3>
                <p className="text-sm text-muted-foreground">Retrieve shared JSON documents</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`GET /api/json/[shareId]

Response:
{
  "id": "abc123",
  "title": "Example JSON",
  "shareId": "xyz789",
  "content": { "key": "value" },
  "publishedAt": "2024-01-01T00:00:00.000Z"
}`}</code>
                </pre>
              </div>

              {/* Upload API */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Upload JSON (Authenticated)
                </h3>
                <p className="text-sm text-muted-foreground">Upload and save JSON documents (requires authentication)</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`POST /api/json/upload
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "title": "My JSON",
  "content": { "key": "value" },
  "isPublic": true
}

Response:
{
  "id": "abc123",
  "shareId": "xyz789",
  "title": "My JSON"
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Integration Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Examples</CardTitle>
              <CardDescription>
                Code examples for common integration scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* JavaScript Example */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">JavaScript / TypeScript</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`// Fetch public library
const response = await fetch('https://jsonviewer.io/api/library?page=1&limit=20');
const data = await response.json();

// Get specific document
const doc = await fetch('https://jsonviewer.io/api/json/xyz789');
const json = await doc.json();`}</code>
                </pre>
              </div>

              {/* Python Example */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Python</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`import requests

# Fetch public library
response = requests.get('https://jsonviewer.io/api/library', params={'page': 1, 'limit': 20})
data = response.json()

# Get specific document
doc = requests.get('https://jsonviewer.io/api/json/xyz789')
json_data = doc.json()`}</code>
                </pre>
              </div>

              {/* cURL Example */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">cURL</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`# Fetch public library
curl "https://jsonviewer.io/api/library?page=1&limit=20"

# Get specific document
curl "https://jsonviewer.io/api/json/xyz789"`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits & Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Rate Limits</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Anonymous users: 100 requests per hour</li>
                  <li>Authenticated users: 1000 requests per hour</li>
                  <li>Rate limit headers included in all responses</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Cache responses when possible to reduce API calls</li>
                  <li>Use pagination parameters to limit response size</li>
                  <li>Handle rate limit errors gracefully with exponential backoff</li>
                  <li>Include proper error handling for network failures</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

