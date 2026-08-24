import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediBook — Healthcare Appointment Manager",
  description:
    "Book and manage your medical appointments with ease. MediBook connects patients with doctors for seamless healthcare scheduling.",
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
