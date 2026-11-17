import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // La base local de desarrollo (PGlite) se carga tal cual desde node_modules.
  serverExternalPackages: ['@electric-sql/pglite'],
  // ...y no viaja a producción: allí nunca se usa y pesa 27 MB.
  outputFileTracingExcludes: { '/*': ['./node_modules/@electric-sql/**/*'] },
};

export default config;
