/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        /**
         * `@/shared/ui` 배럴을 실제 파일 import로 바꿔 준다.
         * 없으면 ServerBadge 하나 쓰는 화면도 공통 UI 전체(framer-motion·Calendar 등)를 끌고 온다
         */
        optimizePackageImports: ['@/shared/ui'],
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.s3.ap-northeast-2.amazonaws.com' },
            { protocol: 'https', hostname: '**.amazonaws.com' },
        ],
    },
}

export default nextConfig
