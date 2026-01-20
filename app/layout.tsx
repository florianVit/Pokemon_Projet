import React from "react"
import type { Metadata, Viewport } from 'next'
import { Press_Start_2P, VT323 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { LanguageProvider } from '@/components/language-provider'
import { BootAnimation } from '@/components/boot-animation'

const pressStart = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel'
})

const vt323 = VT323({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-retro'
})

export const metadata: Metadata = {
  title: 'Pokédex - All Generations',
  description: 'A retro Pokédex featuring all 1025 Pokémon from all 9 generations',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#DC2626',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart.variable} ${vt323.variable} font-retro antialiased`}>
        <LanguageProvider>
          <BootAnimation />
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
