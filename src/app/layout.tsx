"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useChatStore } from '@/store/chatStore';
import { useEffect } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useChatStore((state) => state.user);
  const setUser = useChatStore((state) => state.setUser);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);
  const isInitialized = useChatStore((s) => s.isInitialized);

  useEffect(() => {
    // Skip if already initialized or user exists
    if (isInitialized) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) throw new Error('Não autenticado');

        const userData = await res.json();
        setUser(userData);
      } catch (err: any) {
        setUser(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isInitialized]); // Only depend on isInitialized flag

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
