import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Pulak Jain | Software Developer',
  description: 'Backend focused full stack developer with Hands-on Experience in Solution Design and Implementation. Explore my portfolio and detailed project case studies.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#222222' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1c' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
