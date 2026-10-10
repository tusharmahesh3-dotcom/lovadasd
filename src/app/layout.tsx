import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LandingForge — RAG landing page generator",
  description:
    "Describe your website in plain English and get a live preview plus exportable HTML/CSS, React or Vue.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand to-lilac text-[13px] font-extrabold text-white shadow-sm2">
                LF
              </span>
              <span className="font-display text-[15px] font-bold tracking-tight text-ink">LandingForge</span>
            </Link>
            <nav className="flex items-center gap-1 text-[13px] font-medium">
              <Link className="rounded-btn px-3.5 py-1.5 text-ink-2 transition hover:bg-brand-soft hover:text-brand-dark" href="/">
                Generate
              </Link>
              <Link className="rounded-btn px-3.5 py-1.5 text-ink-2 transition hover:bg-brand-soft hover:text-brand-dark" href="/knowledge-base">
                Library
              </Link>
              <Link className="rounded-btn px-3.5 py-1.5 text-ink-2 transition hover:bg-brand-soft hover:text-brand-dark" href="/architecture">
                Architecture
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-20 border-t border-line px-6 py-10 text-center text-xs text-muted">
          LandingForge · section-level RAG · live preview · exportable code you own
        </footer>
      </body>
    </html>
  );
}
