import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZKProofAPI — Zero-Knowledge Proof Authentication as a Service",
  description:
    "Add passwordless, privacy-preserving authentication to any app in 3 lines of code. Production-ready ZKP infrastructure with sub-5ms verification.",
  keywords: ["zero knowledge proof", "authentication", "ZKP", "API", "passwordless", "privacy"],
  openGraph: {
    title: "ZKProofAPI — Zero-Knowledge Authentication",
    description: "Add passwordless, privacy-preserving auth to any app in 3 lines of code.",
    url: "https://zkproofapi.com",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
