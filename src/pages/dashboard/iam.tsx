import { useEffect, useState } from "react";
import Head from "next/head";
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
import { useIAM } from "@/hooks/useIAM";
import { IAMUser } from "@/types";

export default function IAMPage() {
  const { users, isLoading, error, fetchUsers, createUser, deleteUser } = useIAM();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewSecretOpen, setIsViewSecretOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IAMUser | null>(null);

  // Form fields
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAccessKey, setNewAccessKey] = useState("");
  const [newSecretKey, setNewSecretKey] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewAccessKey("");
    setNewSecretKey("");
    setActionError("");
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newAccessKey.trim() || !newSecretKey.trim()) {
      setActionError("All fields are required");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await createUser({
        name: newName,
        email: newEmail,
        access_key: newAccessKey,
        secret_key: newSecretKey,
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError("");
    try {
      await deleteUser(selectedUser.id);
      setIsDeleteOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const openViewSecret = (user: IAMUser) => {
    setSelectedUser(user);
    setIsViewSecretOpen(true);
  };

  return (
    <AuthGuard>
      <Head>
        <title>IAM - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">IAM</h1>
              <p className="text-sm text-muted-foreground">
                Manage access credentials for your cloud services
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">Create IAM User</Button>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">IAM Users</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {isLoading ? (
                <Loading message="Loading users..." />
              ) : users.length === 0 ? (
                <div className="py-8 sm:py-12 text-center">
                  <p className="text-sm text-muted-foreground">No IAM users found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create your first IAM user
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Access Key</TableHead>
                        <TableHead className="hidden lg:table-cell">Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm">{user.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                              {user.accessKey}
                            </code>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewSecret(user)}
                                className="text-xs px-2"
                              >
                                <span className="hidden sm:inline">View Secret</span>
                                <span className="sm:hidden">Secret</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteOpen(true);
                                }}
                                className="text-xs px-2"
                              >
                                Delete
                              </Button>
                            </div>
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
        <Dialog open={isCreateOpen} onClose={() => { setIsCreateOpen(false); resetForm(); }}>
          <DialogHeader>
            <DialogTitle>Create IAM User</DialogTitle>
          </DialogHeader>
          <DialogContent>
            {actionError && (
              <Alert variant="destructive" className="mb-4">
                {actionError}
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="my-service-user"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="accessKey" className="text-sm font-medium">
                  Access Key
                </label>
                <Input
                  id="accessKey"
                  placeholder="my-access-key"
                  value={newAccessKey}
                  onChange={(e) => setNewAccessKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="secretKey" className="text-sm font-medium">
                  Secret Key
                </label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="••••••••"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                />
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={actionLoading}>
              Create
            </Button>
          </DialogFooter>
        </Dialog>

        {/* View Secret Dialog */}
        <Dialog open={isViewSecretOpen} onClose={() => setIsViewSecretOpen(false)}>
          <DialogHeader>
            <DialogTitle>IAM User Credentials</DialogTitle>
          </DialogHeader>
          <DialogContent>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Access Key</label>
                  <code className="block rounded bg-muted p-2 text-sm">
                    {selectedUser.accessKey}
                  </code>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Secret Key</label>
                  <code className="block rounded bg-muted p-2 text-sm">
                    {selectedUser.secretKey}
                  </code>
                </div>
                <Alert variant="warning">
                  Keep your secret key secure. Do not share it with anyone.
                </Alert>
              </div>
            )}
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsViewSecretOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete IAM User</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <p>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>?
              This action cannot be undone and will revoke all access.
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

