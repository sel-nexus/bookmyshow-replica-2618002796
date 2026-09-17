/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN;
    return backendOrigin ? [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }] : [];
  }
};

export default nextConfig;
