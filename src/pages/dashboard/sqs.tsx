import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SQSPage() {
  return (
    <AuthGuard>
      <Head>
        <title>Message Queue - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Message Queue</h1>
            <p className="text-muted-foreground">
              SQS-compatible message queuing service
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <span className="text-2xl">📨</span>
                </div>
                <h2 className="text-xl font-semibold">Message Queue Service</h2>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  We&apos;re working hard to bring you SQS-like message queuing
                  capabilities. Stay tuned for updates!
                </p>
                <div className="mt-8">
                  <h3 className="font-medium">Planned Features</h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>• Create and manage message queues</li>
                    <li>• Send and receive messages</li>
                    <li>• Dead letter queue support</li>
                    <li>• Message retention policies</li>
                    <li>• Visibility timeout configuration</li>
                    <li>• FIFO queue support</li>
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
