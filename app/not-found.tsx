import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-3xl font-semibold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
      >
        Go to homepage
      </Link>
    </main>
  );
}
