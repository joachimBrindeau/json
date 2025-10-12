import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const hasTitle = searchParams.has('title');
    const title = hasTitle ? searchParams.get('title')?.slice(0, 100) : 'JSON Viewer';

    const hasDescription = searchParams.has('description');
    const description = hasDescription
      ? searchParams.get('description')?.slice(0, 200)
      : 'Free Online JSON Formatter, Validator & Editor';

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #0070f3, #0050c3)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '60px',
              width: '90%',
              maxWidth: '1000px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Logo/Icon */}
            <div
              style={{
                fontSize: '80px',
                marginBottom: '30px',
              }}
            >
              {'{ }'}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                background: 'linear-gradient(to right, #0070f3, #0050c3)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '24px',
                textAlign: 'center',
                color: '#666',
                marginBottom: '40px',
                maxWidth: '800px',
              }}
            >
              {description}
            </p>

            {/* Features */}
            <div
              style={{
                display: 'flex',
                gap: '30px',
                fontSize: '18px',
                color: '#888',
              }}
            >
              <span>✓ Format</span>
              <span>✓ Validate</span>
              <span>✓ Visualize</span>
              <span>✓ Share</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
