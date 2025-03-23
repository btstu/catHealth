"use client"

import Link from "next/link"
import Image from "next/image"
import { SupabaseAuthButton } from "./supabase-auth-button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/cat-logo.png" alt="CatHealth Logo" width={32} height={32} />
          <span className="font-bold">CatHealth</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/diagnose" className="text-sm font-medium hover:text-primary">
            Get Diagnosis
          </Link>
          <SupabaseAuthButton />
        </nav>
      </div>
    </header>
  )
} 