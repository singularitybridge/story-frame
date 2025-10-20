/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import './globals.css';

export const metadata = {
  title: 'VEO Video Studio',
  description: 'AI Video Generation Studio',
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
