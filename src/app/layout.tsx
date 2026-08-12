import type { Metadata } from 'next';
import { Figtree, Young_Serif } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
});

const youngSerif = Young_Serif({
  variable: '--font-young-serif',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'GiftCircle: invitations with a registry built in',
    template: '%s · GiftCircle',
  },
  description:
    'Send a beautiful event invitation with a collaborative gift registry. Guests reserve gifts in seconds, no account needed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${youngSerif.variable} min-h-dvh antialiased`}>
        {children}
      </body>
    </html>
  );
}
