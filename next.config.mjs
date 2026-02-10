/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "poltjzvbrngbkyhnuodw.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
