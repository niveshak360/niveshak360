import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Niveshak360 — Your Financial Journey Starts Here",
  description: "Learn, invest and track your goals — from your first rupee saved to a diversified portfolio.",
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