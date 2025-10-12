# JSON Share

A minimal, clean JSON sharing webapp built with Next.js and shadcn/ui.

## Features

- **JSON Editor**: Paste or type JSON with syntax validation
- **File Upload**: Import JSON files directly
- **JSON Viewer**: View JSON with syntax highlighting (Monaco Editor)
- **Instant Sharing**: Generate unique shareable links
- **Copy & Download**: Easy copying and downloading of JSON
- **Responsive Design**: Works on all devices
- **Dark Mode Ready**: Supports light/dark themes

## Tech Stack

- Next.js 15 with TypeScript
- shadcn/ui components
- Monaco Editor for code editing
- Tailwind CSS for styling
- LocalStorage for data persistence
- nanoid for unique IDs

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Usage

1. Paste or type JSON in the editor
2. Upload a JSON file using the Upload button
3. Click "Share JSON" to generate a unique link
4. Share the link with others
5. Recipients can view, copy, and download the JSON

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── page.tsx         # Main page
│   ├── share/[id]/      # Share page route
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── json-editor.tsx  # JSON input component
│   ├── json-viewer.tsx  # JSON display component
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities
│   ├── storage.ts      # Storage abstraction
│   └── utils.ts        # Helper functions
└── public/            # Static assets
```

## Future Enhancements

- Database integration (Supabase/PostgreSQL)
- JSON Schema validation
- API endpoint for programmatic access
- User accounts and history
- JSON diff viewer
- Export to various formats

## License

MIT
