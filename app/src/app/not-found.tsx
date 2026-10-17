import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <Button
          className="mt-4"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
