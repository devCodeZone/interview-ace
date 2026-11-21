import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "InterviewAce — AI mock interviews for frontend developers",
  description: "Upload your resume and face a live AI interview panel: spoken answers, coding tests, company-wise patterns and a hire / no-hire report.",
};
export const viewport: Viewport = { themeColor: "#0a0e17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">{children}</main>
      </body>
    </html>
  );
}
