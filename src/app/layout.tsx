"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useChatStore } from '@/store/chatStore';
import { useEffect } from 'react';
import { ApiError } from "@/types/errors";

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
  const setUser = useChatStore((state) => state.setUser);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);

  // Remove unused variables
  // const user = useChatStore((state) => state.user);
  // const isInitialized = useChatStore((s) => s.isInitialized);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/user');
        const data = await response.json();

        if (data.id) {
          setUser(data);
        } else {
          setError('Not authenticated');
        }
      } catch (error: unknown) {
        const apiError = error as ApiError;
        setError(apiError.message || 'Authentication error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setError, setLoading, setUser]);

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
