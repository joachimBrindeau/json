"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ padding: 24 }}>
        <h2>Something went wrong</h2>
        {process.env.NODE_ENV !== 'production' && (
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error?.message}</pre>
        )}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}

