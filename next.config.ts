// next.config.ts
import type { NextConfig } from "next";

// CSP mais amigável para YouTube
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.youtube-nocookie.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://i.ytimg.com;
  font-src 'self' data:;
  connect-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
  frame-src https://www.youtube.com https://www.youtube-nocookie.com;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, " ").trim();

// Headers de segurança - sem COEP/COOP que quebram o YouTube
const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Esse só impede que OUTROS sites te coloquem em iframe; pode manter
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), interest-cohort=()" },
  // Removidos os três abaixo que atrapalham iframes de terceiros:
  // { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: ["i.ytimg.com"], // se um dia usar thumbs do YouTube
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
