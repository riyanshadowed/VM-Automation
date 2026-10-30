import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VyaparMitra - Instagram Growth & Automation",
  description: "Official Meta Graph API Instagram Comment-to-DM automation for creators & businesses.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased bg-[#090d16] text-slate-100`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      dark: {
                        bg: '#090d16',
                        card: '#111827',
                        cardHover: '#162032',
                        border: '#1f293d',
                        borderHover: '#334155',
                        muted: '#64748b'
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
