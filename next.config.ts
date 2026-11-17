import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // La base local de desarrollo (PGlite) se carga tal cual desde node_modules.
  serverExternalPackages: ['@electric-sql/pglite'],
};

export default config;
