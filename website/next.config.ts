import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/dashboard/:path*",
        destination: "http://localhost:8000/dashboard/:path*",
      },
      {
        source: "/v1/:path*",
        destination: "http://localhost:8000/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
