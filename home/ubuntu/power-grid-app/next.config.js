/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Отключаем ESLint во время сборки для продакшена
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Отключаем проверку типов во время сборки для продакшена
    ignoreBuildErrors: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig

