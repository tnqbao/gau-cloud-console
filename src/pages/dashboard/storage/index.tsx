import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { Alert } from "@/components/ui/Alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useBuckets } from "@/hooks/useStorage";

const REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
];

export default function StoragePage() {
  const {
    buckets,
    isLoading,
    error,
    fetchBuckets,
    createBucket,
    deleteBucket,
  } = useBuckets();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketRegion, setNewBucketRegion] = useState("us-east-1");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const handleCreate = async () => {
    if (!newBucketName.trim()) return;
    setActionLoading(true);
    setActionError("");
    try {
      await createBucket({ name: newBucketName, region: newBucketRegion });
      setIsCreateOpen(false);
      setNewBucketName("");
      setNewBucketRegion("us-east-1");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create bucket");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBucket) return;
    setActionLoading(true);
    setActionError("");
    try {
      await deleteBucket(selectedBucket);
      setIsDeleteOpen(false);
      setSelectedBucket(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete bucket");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };


  return (
    <AuthGuard>
      <Head>
        <title>Storage - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Storage</h1>
              <p className="text-sm text-muted-foreground">
                Manage your S3-compatible storage buckets
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">Create Bucket</Button>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">{error}</Alert>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Buckets</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loading message="Loading buckets..." />
              ) : buckets.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No buckets found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create your first bucket
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Bucket ID</TableHead>
                        <TableHead className="hidden md:table-cell">Region</TableHead>
                        <TableHead className="hidden lg:table-cell">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buckets.map((bucket) => (
                        <TableRow key={bucket.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/storage/${bucket.id}`}
                              className="font-medium text-primary hover:underline text-sm"
                            >
                              {bucket.name}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-muted-foreground">
                                {bucket.id.substring(0, 8)}...
                              </code>
                              <button
                                onClick={() => handleCopyId(bucket.id)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Copy full ID"
                              >
                                {copiedId === bucket.id ? (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary">
                              {bucket.region}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {new Date(bucket.createdAt).toLocaleDateString()}
                          </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBucket(bucket.id);
                              setIsDeleteOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Bucket</DialogTitle>
          </DialogHeader>
          <DialogContent>
            {actionError && (
              <Alert variant="destructive" className="mb-4">
                {actionError}
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="bucketName" className="text-sm font-medium">
                  Bucket Name
                </label>
                <Input
                  id="bucketName"
                  placeholder="my-bucket"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="bucketRegion" className="text-sm font-medium">
                  Region
                </label>
                <select
                  id="bucketRegion"
                  value={newBucketRegion}
                  onChange={(e) => setNewBucketRegion(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {REGIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={actionLoading}>
              Create
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete Bucket</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <p>
              Are you sure you want to delete this bucket? This action cannot be
              undone.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={actionLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      </DashboardLayout>
    </AuthGuard>
  );
}
