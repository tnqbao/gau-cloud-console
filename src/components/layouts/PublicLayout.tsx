import Link from "next/link";
import { Button } from "@/components/ui/Button";
import NextImage from "next/image";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-2">
            <NextImage src="/logo.svg" alt="Logo" width={32} height={32} />
            <span className="font-semibold text-lg">Gauas Cloud</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 Gauas Cloud. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Documentation
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Support
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

