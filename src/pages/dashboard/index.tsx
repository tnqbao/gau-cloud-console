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
        <title>Dashboard - Home Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back{user?.name ? `, ${user.name}` : ""}</h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your cloud resources
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {isLoaded ? stat.value : "..."}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link
                  href="/dashboard/storage"
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium">Create Bucket</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up a new storage bucket for your files
                  </p>
                </Link>
                <Link
                  href="/dashboard/iam"
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium">Add IAM User</h3>
                  <p className="text-sm text-muted-foreground">
                    Create access credentials for your services
                  </p>
                </Link>
                <Link
                  href="/dashboard/sqs"
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium">Create Queue</h3>
                  <p className="text-sm text-muted-foreground">
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

