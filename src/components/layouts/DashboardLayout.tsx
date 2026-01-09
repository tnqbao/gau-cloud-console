import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Navigation items with icons
const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    href: "/dashboard/storage",
    label: "Object Storage",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    )
  },
  {
    href: "/dashboard/iam",
    label: "IAM",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    href: "/dashboard/sqs",
    label: "Message Queue",
    comingSoon: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    href: "/dashboard/vm",
    label: "Virtual Machines",
    comingSoon: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
  },
  {
    href: "/dashboard/rds",
    label: "Relational Database",
    comingSoon: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isActive = (href: string, exact = false) => {
    if (exact) return router.pathname === href;
    return router.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-14 items-center px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <NextImage src="/logo.svg" alt="Logo" width={32} height={32} />
            <span className="font-semibold">Gauas Cloud</span>
          </Link>

          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 border-r bg-background">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.comingSoon ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative",
                  item.comingSoon
                    ? "text-muted-foreground/50 cursor-not-allowed hover:bg-muted/50"
                    : isActive(item.href, item.exact)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={(e) => item.comingSoon && e.preventDefault()}
              >
                <span className={cn(item.comingSoon && "opacity-50")}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.comingSoon && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground border">
                    Soon
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

