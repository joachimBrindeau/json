'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to viewer page
    if (params.id && typeof params.id === 'string') {
      router.replace(`/library/${params.id}`);
    } else {
      router.replace('/');
    }
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
