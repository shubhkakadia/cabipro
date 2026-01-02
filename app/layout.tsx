import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import AOSProvider from "@/components/AOSProvider";
import ConditionalLayout from "@/components/ConditionalLayout";
import ReduxProvider from "@/components/ReduxProvider";

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
  title: "CabiPro - Job Management Software for Cabinet Manufacturers",
  description: "Streamline your cabinet manufacturing operations with job tracking, material management, production scheduling, and more. Built specifically for cabinet manufacturers.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="bg-white text-gray-900 antialiased font-sans">
        <ReduxProvider>
          <AOSProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AOSProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
