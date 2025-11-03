'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to viewer page
    const idParam = (params as Record<string, string | string[]> | null)?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (typeof id === 'string' && id) {
      router.replace(`/library/${id}`);
    } else {
      router.replace('/');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
