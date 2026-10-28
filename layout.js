import './globals.css'
import { Newsreader, Inter_Tight } from 'next/font/google'
const serif = Newsreader({ subsets: ['latin','latin-ext'], variable: '--serif', style: ['normal','italic'] })
const sans = Inter_Tight({ subsets: ['latin','latin-ext'], variable: '--sans' })
export const metadata = { title: 'Parfüm Rehberi', description: 'Sana uygun parfümü bul.' }
export default function RootLayout({ children }) {
  return <html lang="tr" className={`${serif.variable} ${sans.variable}`}><body>{children}</body></html>
}
