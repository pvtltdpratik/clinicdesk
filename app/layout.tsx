import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif, Lora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const loraHeading = Lora({subsets:['latin'],variable:'--font-heading'});

const notoSerif = Noto_Serif({subsets:['latin'],variable:'--font-serif'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinic",
  description: "Clinic management for doctors and receptionists",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Browser extensions (e.g. LanguageTool, Grammarly) add attributes to
      // <html> before React loads; this ignores those on this element only.
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-serif", notoSerif.variable, loraHeading.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
