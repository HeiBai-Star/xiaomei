import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 静态导出
  output: 'export',
  // 静态资源路径
  assetPrefix: './',
  // 禁用 Image Optimization（静态导出时需要）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
