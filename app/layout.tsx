/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import './globals.css';

export const metadata = {
  title: 'Echo - AI Video Creation',
  description: 'AI-powered video creation platform for artists and creators to craft compelling visual stories',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
