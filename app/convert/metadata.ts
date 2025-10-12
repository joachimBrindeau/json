import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Converter - Convert JSON to YAML, XML, CSV, TOML & More | JSON Viewer',
  description: 'Free online JSON converter tool. Convert JSON to YAML, XML, CSV, TOML, Properties, TypeScript, and JavaScript formats. Fast, secure, and easy to use with syntax highlighting.',
  keywords: [
    'json converter',
    'json to yaml',
    'json to xml', 
    'json to csv',
    'json to toml',
    'json to properties',
    'json to typescript',
    'json to javascript',
    'convert json',
    'format converter',
    'data conversion',
    'online converter',
    'free json tools'
  ],
  openGraph: {
    title: 'JSON Converter - Convert to Multiple Formats',
    description: 'Convert JSON to YAML, XML, CSV, TOML, Properties, TypeScript, and JavaScript. Free online tool with syntax highlighting and instant conversion.',
    type: 'website',
    url: 'https://json-viewer.io/convert',
    images: [
      {
        url: '/og-convert.png',
        width: 1200,
        height: 630,
        alt: 'JSON Converter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Converter - Convert to Multiple Formats',
    description: 'Convert JSON to YAML, XML, CSV, TOML, and more. Free online tool with instant conversion.',
    images: ['/og-convert.png'],
  },
  alternates: {
    canonical: 'https://json-viewer.io/convert',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};