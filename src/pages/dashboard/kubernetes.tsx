import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function KubernetesPage() {
  return (
    <AuthGuard>
      <Head>
        <title>Kubernetes Namespace - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Kubernetes Namespace</h1>
            <p className="text-muted-foreground">
              Manage Kubernetes namespaces and resources
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <span className="text-2xl">☸️</span>
                </div>
                <h2 className="text-xl font-semibold">Kubernetes Namespace</h2>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  We&apos;re working hard to bring you Kubernetes namespace
                  management capabilities. Stay tuned for updates!
                </p>
                <div className="mt-8">
                  <h3 className="font-medium">Planned Features</h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>• Create and manage Kubernetes namespaces</li>
                    <li>• Deploy applications to K8s clusters</li>
                    <li>• Resource quota management</li>
                    <li>• Network policies and ingress</li>
                    <li>• ConfigMaps and Secrets</li>
                    <li>• Pod monitoring and logs</li>
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

