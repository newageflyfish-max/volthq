import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Volt HQ — The compute price oracle for AI agents',
  description:
    'Compare pricing across AI providers. Route to the cheapest option. Track spend and savings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
