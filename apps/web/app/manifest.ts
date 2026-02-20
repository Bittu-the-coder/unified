import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Unified Workspace',
    short_name: 'Unified',
    description: 'Unified workspace for messaging, productivity, files, and identity.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B192C',
    theme_color: '#FF6500',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
