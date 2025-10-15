import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './fonts.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuranAkh - Digital Quran Learning Platform',
  description: 'Complete Quran memorization and teaching platform for Islamic schools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/fonts.css" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}