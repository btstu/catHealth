"use client"

import Link from "next/link"
import { AuthButton } from "./auth-button"
import Image from "next/image"

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
          <AuthButton />
        </nav>
      </div>
    </header>
  )
} 