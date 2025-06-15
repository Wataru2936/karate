import type { Metadata } from 'next'
import './globals.css'
import Layout from '@/components/Layout'

export const metadata: Metadata = {
  title: '空手道 試合記録・分析ツール',
  description: '全空連ルール準拠の空手道試合記録・分析ツール',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <base href="/karate/" />
      </head>
      <body>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  )
} 