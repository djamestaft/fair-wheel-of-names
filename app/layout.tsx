import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fair Wheel of Names",
  description: "A fair wheel-of-names picker for stand-ups that prevents same person from winning repeatedly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
