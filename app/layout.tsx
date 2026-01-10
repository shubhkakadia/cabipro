import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AOSProvider from "@/components/AOSProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CabiPro - Cabinet Maker Software | Job Management for Cabinet Shops & Joinery",
  description: "Cabinet maker software to manage jobs, production, materials & installations. Built for cabinet makers, cabinet manufacturers, and joinery workshops. Track production, manage materials, schedule jobs, and optimize your manufacturing floor.",
  openGraph: {
    title: "CabiPro - Cabinet Maker Software | Job Management for Cabinet Shops & Joinery",
    description: "Cabinet maker software to manage jobs, production, materials & installations. Built for cabinet makers, cabinet manufacturers, and joinery workshops.",
    images: [
      {
        url: "/CabiPro.svg",
        width: 1200,
        height: 630,
        alt: "CabiPro Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CabiPro - Cabinet Maker Software",
    description: "Cabinet maker software to manage jobs, production, materials & installations.",
    images: ["/CabiPro.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-white text-gray-900 antialiased font-sans">
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y66VP06VQN"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Y66VP06VQN');
            `,
          }}
        />
        <AOSProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AOSProvider>
      </body>
    </html>
  );
}
