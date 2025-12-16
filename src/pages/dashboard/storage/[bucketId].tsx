import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { Alert } from "@/components/ui/Alert";
import { useBucketObjects } from "@/hooks/useStorage";
import { BucketObject } from "@/types";
import { cn } from "@/lib/utils";

interface TreeNodeProps {
  node: BucketObject;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50",
          node.type === "folder" && "cursor-pointer"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => node.type === "folder" && setIsExpanded(!isExpanded)}
      >
        {node.type === "folder" ? (
          <span className="text-muted-foreground text-sm">
            {isExpanded ? "▼" : "▶"}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <span
          className={cn(
            "flex-1 text-sm",
            node.type === "folder" && "font-medium"
          )}
        >
          {node.name}
        </span>
        {node.type === "file" && (
          <>
            <span className="text-xs text-muted-foreground">
              {formatBytes(node.size)}
            </span>
            <span className="text-xs text-muted-foreground">
              {node.lastModified
                ? new Date(node.lastModified).toLocaleDateString()
                : "—"}
            </span>
          </>
        )}
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BucketDetailPage() {
  const router = useRouter();
  const { bucketId } = router.query as { bucketId: string };

  const { objects, isLoading, error, fetchObjects } = useBucketObjects(bucketId);

  useEffect(() => {
    if (bucketId) {
      fetchObjects();
    }
  }, [bucketId, fetchObjects]);

  return (
    <AuthGuard>
      <Head>
        <title>Bucket Detail - Home Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/storage" className="text-muted-foreground hover:text-foreground">
              Storage
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{bucketId}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bucket Objects</h1>
              <p className="text-muted-foreground">
                Browse and manage files in this bucket
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Upload File</Button>
              <Button>Create Folder</Button>
            </div>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          <Card>
            <CardHeader>
              <CardTitle>Files & Folders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loading message="Loading objects..." />
              ) : objects.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">This bucket is empty</p>
                  <Button variant="outline" className="mt-4">
                    Upload your first file
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span className="flex-1">Name</span>
                    <span className="w-20 text-right">Size</span>
                    <span className="w-24 text-right">Modified</span>
                  </div>
                  <div className="py-1">
                    {objects.map((object) => (
                      <TreeNode key={object.id} node={object} level={0} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

