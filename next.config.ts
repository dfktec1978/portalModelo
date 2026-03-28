import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "poltjzvbrngbkyhnuodw.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "files.manuscdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
