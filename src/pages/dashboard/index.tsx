import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useBuckets } from "@/hooks/useStorage";
import { useIAM } from "@/hooks/useIAM";
import { useSQS } from "@/hooks/useSQS";

export default function DashboardPage() {
  const { user } = useAuth();
  const { buckets, fetchBuckets } = useBuckets();
  const { users: iamUsers, fetchUsers } = useIAM();
  const { queues, fetchQueues } = useSQS();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchBuckets(), fetchUsers(), fetchQueues()]).finally(() =>
      setIsLoaded(true)
    );
  }, [fetchBuckets, fetchUsers, fetchQueues]);

  const stats = [
    {
      title: "Storage Buckets",
      value: buckets.length,
      href: "/dashboard/storage",
      description: "Total buckets created",
    },
    {
      title: "IAM Users",
      value: iamUsers.length,
      href: "/dashboard/iam",
      description: "Access credentials",
    },
    {
      title: "Message Queues",
      value: queues.length,
      href: "/dashboard/sqs",
      description: "Active queues",
    },
    {
      title: "Virtual Machines",
      value: "—",
      href: "/dashboard/vm",
      description: "Coming soon",
    },
  ];

  return (
    <AuthGuard>
      <Head>
        <title>Dashboard - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back{user?.name ? `, ${user.name}` : ""}</h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s an overview of your cloud resources
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="transition-colors hover:bg-muted/50 h-full">
                  <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-2xl sm:text-3xl font-bold">
                      {isLoaded ? stat.value : "..."}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/dashboard/storage"
                  className="rounded-lg border p-3 sm:p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium text-sm sm:text-base">Create Bucket</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Set up a new storage bucket for your files
                  </p>
                </Link>
                <Link
                  href="/dashboard/iam"
                  className="rounded-lg border p-3 sm:p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium text-sm sm:text-base">Add IAM User</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Create access credentials for your services
                  </p>
                </Link>
                <Link
                  href="/dashboard/sqs"
                  className="rounded-lg border p-3 sm:p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium text-sm sm:text-base">Create Queue</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Set up a message queue for async processing
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

