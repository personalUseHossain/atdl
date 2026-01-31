// app/layout.js
import { IBM_Plex_Sans, IBM_Plex_Serif, Inter, Lato, Merriweather, Open_Sans, Playfair_Display, Roboto, Roboto_Slab, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import { Providers } from './components/Providers';
import ConditionalFooter from './components/ConditionalFooter';

const inter = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
    weight: ['400', '700'],
  variable: '--font-inter',
});

const sourceSerif4 = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-serif-pro', // keep the same CSS variable name so globals.css needs no change
  weight: ['400', '700'],
});

export const metadata = {
  title: 'ATDL Research Platform',
  description: 'Drug-Health Connection Research Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable}`}>
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}