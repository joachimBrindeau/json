import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth/admin';
import { SuperAdminDashboard } from '@/components/features/admin/SuperAdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Superadmin Dashboard - JSON Viewer',
  description: 'Administrative dashboard for system management',
  robots: 'noindex,nofollow',
};

export default async function SuperAdminPage() {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">System administration and analytics</p>
        </div>

        <SuperAdminDashboard />
      </div>
    </div>
  );
}
