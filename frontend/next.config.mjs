/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const backendOrigin = process.env.BACKEND_ORIGIN;
    return backendOrigin ? [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }] : [];
  }
};

export default nextConfig;
