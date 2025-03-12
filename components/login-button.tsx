"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function LoginButton() {
  const searchParams = useSearchParams()
  const from = searchParams?.get("from")

  if (from === "/diagnose") {
    toast.error("Please sign in to access the diagnosis feature")
  }

  return (
    <Button 
      size="lg"
      onClick={() => signIn("google", { callbackUrl: from || "/" })}
      className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
    >
      Get Started with Google
    </Button>
  )
} 