
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/components/providers/Web3Provider'
import NetworkSwitcher from '@/components/NetworkSwitcher'

const inter = Inter({ subsets: ['latin'] })
// Metadata for SEO and social sharing
export const metadata = {
  title: 'Yield Delta',
  description: 'AI-driven dynamic liquidity vaults on SEI EVM',
  openGraph: {
    title: 'Yield Delta',
    description: 'AI-driven dynamic liquidity vaults on SEI EVM',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Yield Delta' }],
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon-32.svg',
    apple: '/favicon-128.svg',
  },
}
// QueryClient is managed internally in Web3Provider

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Client-side web3 and query providers */}
        <Web3Provider>
          <NetworkSwitcher />
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}
