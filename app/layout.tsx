import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportsClan | Play together",
  description:
    "Create a sports tournament, set the price and player spots, choose a local venue, and invite your friends with SportsClan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
