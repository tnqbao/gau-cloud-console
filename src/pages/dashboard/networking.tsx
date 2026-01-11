import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NetworkingPage() {
  return (
    <AuthGuard>
      <Head>
        <title>Networking - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Networking</h1>
            <p className="text-muted-foreground">
              Manage virtual networks and connectivity
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <span className="text-2xl">🌐</span>
                </div>
                <h2 className="text-xl font-semibold">Networking Service</h2>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  We&apos;re working hard to bring you advanced networking
                  capabilities. Stay tuned for updates!
                </p>
                <div className="mt-8">
                  <h3 className="font-medium">Planned Features</h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>• Virtual Private Cloud (VPC)</li>
                    <li>• Subnets and routing tables</li>
                    <li>• Load balancers</li>
                    <li>• Security groups and firewalls</li>
                    <li>• VPN and private connectivity</li>
                    <li>• DNS management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

