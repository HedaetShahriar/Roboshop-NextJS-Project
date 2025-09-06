import fs from 'fs';
import path from 'path';

function loadImageDomains() {
    // best-effort: read persisted settings JSON if available during build
    // In SSR deployments with DB only, this may be empty until runtime.
    try {
        const p = path.join(process.cwd(), '.next-runtime-settings.json');
        if (fs.existsSync(p)) {
            const s = JSON.parse(fs.readFileSync(p, 'utf8'));
            const list = s?.performance?.imageDomains;
            if (Array.isArray(list)) return list.map(String).filter(Boolean);
        }
    } catch {}
    return [];
}

const dynamicDomains = loadImageDomains();

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [320, 640, 768, 1024, 1280, 1536],
        imageSizes: [16, 24, 32, 48, 64, 96, 128, 256],
        minimumCacheTTL: 3600,
    remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.robodocbd.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'www.qaxovilugi.in',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'imgur.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.ctfassets.net',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'example.com',
                port: '',
                pathname: '/**',
            },
            // dynamic from settings (hostnames only)
            ...dynamicDomains.map((host) => ({ protocol: 'https', hostname: host, port: '', pathname: '/**' })),
        ],
    },
};

export default nextConfig;
