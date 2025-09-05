import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallBanner, { PWAUpdateBanner } from "@/components/PWAInstallBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocApp - Medical Practice Management",
  description: "Healthcare management system for patient tracking and appointments",
  manifest: "/manifest.json",
  applicationName: "DocApp",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DocApp",
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-72x72.svg" />
        {/* Add specific apple touch icons for different device sizes */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.svg" />
        {/* Add splash screen for iOS */}
        <link 
          rel="apple-touch-startup-image" 
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" 
          href="/icons/icon-512x512.svg" 
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <PWAInstallBanner />
        <PWAUpdateBanner />
      </body>
    </html>
  );
}
