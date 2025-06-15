import type { Metadata } from 'next'
import './globals.css'
import Layout from '@/components/Layout'

export const metadata: Metadata = {
  title: '空手道 試合記録・分析ツール',
  description: '全空連ルール準拠の空手道試合記録・分析ツール',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
      </head>
      <body>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  )
} 