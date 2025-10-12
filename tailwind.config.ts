import type { Config } from 'tailwindcss';

// JSON Sea size constants
const sizes = {
  nodeMinWidth: 220,
  nodeMaxWidth: 440,
  arrayNodeSize: 64,
  nodeGap: 100,
  nodeContentHeight: 40,
  nodePadding: 12,
  nodeDetailPanelWidth: 420,
};

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      spacing: {
        nodeMinWidth: `${sizes.nodeMinWidth}px`,
        nodeMaxWidth: `${sizes.nodeMaxWidth}px`,
        arrayNodeSize: `${sizes.arrayNodeSize}px`,
        nodeGap: `${sizes.nodeGap}px`,
        nodeContentHeight: `${sizes.nodeContentHeight}px`,
        nodePadding: `${sizes.nodePadding}px`,
        nodeDetailPanelWidth: `${sizes.nodeDetailPanelWidth}px`,
      },
      minWidth: {
        nodeMinWidth: `${sizes.nodeMinWidth}px`,
        arrayNodeSize: `${sizes.arrayNodeSize}px`,
      },
      maxWidth: {
        nodeMaxWidth: `${sizes.nodeMaxWidth}px`,
        arrayNodeSize: `${sizes.arrayNodeSize}px`,
      },
      minHeight: {
        arrayNodeSize: `${sizes.arrayNodeSize}px`,
      },
      maxHeight: {
        arrayNodeSize: `${sizes.arrayNodeSize}px`,
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
