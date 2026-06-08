import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource-variable/google-sans-flex";
import "./globals.css";
import ClientLogger from "@/components/ClientLogger";

export const metadata: Metadata = {
  title: "NextFlow",
  description: "LLM Workflow Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-gray-900 antialiased">
          <ClientLogger />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
