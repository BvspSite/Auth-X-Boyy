import './globals.css';

export const metadata = {
  title: 'AUTH-X-BOY — Cloud License Authentication System',
  description: 'Enterprise grade license authentication, hardware ID locking, and security platform powered by XBOY.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
