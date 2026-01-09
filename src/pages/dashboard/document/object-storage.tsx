import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

function CopyableCode({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group">
      {label && <h3 className="font-semibold mb-3">{label}</h3>}
      <div className="bg-muted px-4 py-2 rounded text-sm font-mono flex items-center justify-between gap-4">
        <code className="flex-1 break-all">{code}</code>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-1 text-xs bg-background hover:bg-muted-foreground/10 border rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function CodeBlock({ children, language = "http" }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const highlightCode = (code: string, lang: string) => {
    if (lang === "http") {
      return code.split("\n").map((line, i) => {
        // HTTP Methods
        if (line.match(/^(GET|POST|PUT|DELETE|PATCH)/)) {
          const parts = line.split(" ");
          return (
            <div key={i}>
              <span style={{ color: "#C586C0" }} className="font-semibold">{parts[0]}</span>
              {" "}
              <span style={{ color: "#4EC9B0" }}>{parts.slice(1).join(" ")}</span>
            </div>
          );
        }
        // Headers
        if (line.includes(": ")) {
          const [key, ...valueParts] = line.split(": ");
          const value = valueParts.join(": ");
          return (
            <div key={i}>
              <span style={{ color: "#9CDCFE" }}>{key}</span>
              <span>: </span>
              <span style={{ color: "#CE9178" }}>{value}</span>
            </div>
          );
        }
        // Boundaries
        if (line.startsWith("--boundary")) {
          return <div key={i} style={{ color: "#6A9955" }}>{line}</div>;
        }
        // Content-Disposition
        if (line.includes("Content-Disposition")) {
          return <div key={i} style={{ color: "#DCDCAA" }}>{line}</div>;
        }
        // Comments or data
        if (line.startsWith("[")) {
          return <div key={i} style={{ color: "#6A9955" }} className="italic">{line}</div>;
        }
        return <div key={i}>{line || "\u00A0"}</div>;
      });
    }

    if (lang === "json") {
      return code.split("\n").map((line, i) => {
        // Calculate leading spaces for indentation
        const leadingSpaces = line.match(/^(\s*)/)?.[1] || "";
        const trimmed = line.trim();

        // Property names with values
        if (trimmed.match(/^"[\w_]+"\s*:/)) {
          const match = line.match(/^(\s*)("[\w_]+")(\s*:\s*)(.*)/);
          if (match) {
            const [, spaces, key, colon, rest] = match;
            let valueColor = "#D4D4D4";
            // String values
            if (rest.trim().startsWith('"')) {
              valueColor = "#CE9178";
            }
            // Numbers
            else if (rest.trim().match(/^\d+/)) {
              valueColor = "#B5CEA8";
            }
            // Booleans
            else if (rest.trim().match(/^(true|false)/)) {
              valueColor = "#569CD6";
            }
            // Arrays or objects
            else if (rest.trim().match(/^[[{]/)) {
              valueColor = "#FFD700";
            }
            return (
              <div key={i}>
                <span>{spaces}</span>
                <span style={{ color: "#9CDCFE" }}>{key}</span>
                <span>{colon}</span>
                <span style={{ color: valueColor }}>{rest}</span>
              </div>
            );
          }
        }
        // Braces and brackets with potential commas
        if (trimmed.match(/^[{}\[\]],?$/)) {
          return <div key={i}><span>{leadingSpaces}</span><span style={{ color: "#FFD700" }}>{trimmed}</span></div>;
        }
        return <div key={i}>{line || "\u00A0"}</div>;
      });
    }

    return code.split("\n").map((line, i) => <div key={i}>{line || "\u00A0"}</div>);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs bg-background/80 hover:bg-background border rounded transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-[#1e1e1e] dark:bg-[#1e1e1e] text-[#d4d4d4] dark:text-[#d4d4d4] p-4 rounded-md text-xs font-mono overflow-x-auto">
        {highlightCode(children, language)}
      </pre>
    </div>
  );
}

export default function ObjectStorageDocPage() {
  return (
    <AuthGuard>
      <Head>
        <title>Object Storage API Documentation - Gauas Cloud</title>
      </Head>

      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8 py-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Object Storage API Documentation</h1>
            <p className="text-muted-foreground">
              Complete guide for managing files and folders in Object Storage using our API
            </p>
          </div>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyableCode
                code="https://api.gauas.online"
                label="Base URL"
              />

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <p className="text-sm font-semibold mb-1">Authentication Required</p>
                <p className="text-sm">
                  To use the API, you need an <strong>Access Key</strong> and <strong>Secret Key</strong>.
                  If you don&apos;t have them yet, please create them at{' '}
                  <Link href="/dashboard/iam" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    IAM Management
                  </Link>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication (HMAC Signature)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                All API requests require authentication via HMAC signature with Access Key and Secret Key.
              </p>

              {/* Required Headers */}
              <div>
                <h3 className="font-semibold mb-3">Required Headers</h3>
                <div className="bg-muted p-4 rounded-md space-y-2 font-mono text-sm">
                  <div>Authorization: HMAC &lt;accessKey&gt;:&lt;signature&gt;</div>
                  <div>X-Timestamp: &lt;unix_timestamp&gt;</div>
                </div>
              </div>

              {/* Signature Process */}
              <div>
                <h3 className="font-semibold mb-3">Signature Generation Process</h3>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Step 1: Create string_to_sign</h4>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm mb-3">
                      METHOD\nPATH\nTIMESTAMP\nSHA256(body)
                    </div>

                    <table className="w-full border text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left px-4 py-2 border">Component</th>
                          <th className="text-left px-4 py-2 border">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border font-mono">METHOD</td>
                          <td className="px-4 py-2 border">HTTP method in uppercase (POST, GET, DELETE)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border font-mono">PATH</td>
                          <td className="px-4 py-2 border">Path without domain (e.g., /api/v1/cloud/buckets/...)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border font-mono">TIMESTAMP</td>
                          <td className="px-4 py-2 border">Unix timestamp in seconds</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border font-mono">SHA256(body)</td>
                          <td className="px-4 py-2 border">SHA256 hash of request body (hex)</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                      <p className="text-sm font-semibold mb-2">Important Note</p>
                      <p className="text-sm">If body is empty, use this hash:</p>
                      <code className="block mt-2 text-xs font-mono break-all bg-background p-2 rounded">
                        e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </code>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Step 2: Calculate signature</h4>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm mb-2">
                      signature = HMAC-SHA256(secretKey, string_to_sign)
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Output: hex encoded (64 characters)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">1. Upload File API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <CopyableCode
                code="POST https://api.gauas.online/api/v1/cloud/buckets/:bucket_id/objects"
                label="Endpoint"
              />

              {/* Parameters */}
              <div>
                <h3 className="font-semibold mb-3">URL Parameters</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 border">Parameter</th>
                      <th className="text-left px-4 py-2 border">Type</th>
                      <th className="text-left px-4 py-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-mono">bucket_id</td>
                      <td className="px-4 py-2 border">UUID</td>
                      <td className="px-4 py-2 border">ID of the bucket to upload to</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Request Body */}
              <div>
                <h3 className="font-semibold mb-3">Request Body (multipart/form-data)</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 border">Field</th>
                      <th className="text-left px-4 py-2 border">Type</th>
                      <th className="text-left px-4 py-2 border">Required</th>
                      <th className="text-left px-4 py-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-mono">file</td>
                      <td className="px-4 py-2 border">File</td>
                      <td className="px-4 py-2 border">Yes</td>
                      <td className="px-4 py-2 border">File to upload</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border font-mono">path</td>
                      <td className="px-4 py-2 border">String</td>
                      <td className="px-4 py-2 border">No</td>
                      <td className="px-4 py-2 border">Folder path (e.g., folder1/folder2)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Example Request */}
              <div>
                <h3 className="font-semibold mb-3">Example Request</h3>
                <CodeBlock language="http">
{`POST https://api.gauas.online/api/v1/cloud/buckets/123e4567-e89b-12d3-a456-426614174000/objects
Authorization: HMAC your-access-key:generated-signature
X-Timestamp: 1736416263
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="example.jpg"

[file binary data]
--boundary
Content-Disposition: form-data; name="path"

images/2024
--boundary--`}
                </CodeBlock>
              </div>

              {/* Response */}
              <div>
                <h3 className="font-semibold mb-3">Response (Success)</h3>
                <CodeBlock language="json">
{`{
  "success": true,
  "object": {
    "id": "obj-uuid",
    "name": "example.jpg",
    "size": 1024000,
    "path": "images/2024",
    "created_at": "2024-01-09T10:00:00Z"
  }
}`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* Get All Objects API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">2. Get All Objects API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <CopyableCode
                code="GET https://api.gauas.online/api/v1/cloud/buckets/:bucket_id/objects"
                label="Endpoint"
              />

              {/* Parameters */}
              <div>
                <h3 className="font-semibold mb-3">URL Parameters</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 border">Parameter</th>
                      <th className="text-left px-4 py-2 border">Type</th>
                      <th className="text-left px-4 py-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-mono">bucket_id</td>
                      <td className="px-4 py-2 border">UUID</td>
                      <td className="px-4 py-2 border">ID of the bucket</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Query Parameters */}
              <div>
                <h3 className="font-semibold mb-3">Query Parameters</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 border">Parameter</th>
                      <th className="text-left px-4 py-2 border">Type</th>
                      <th className="text-left px-4 py-2 border">Required</th>
                      <th className="text-left px-4 py-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-mono">path</td>
                      <td className="px-4 py-2 border">String</td>
                      <td className="px-4 py-2 border">No</td>
                      <td className="px-4 py-2 border">Folder path to list (e.g., folder1/folder2). Leave empty for root.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border font-mono">limit</td>
                      <td className="px-4 py-2 border">Number</td>
                      <td className="px-4 py-2 border">No</td>
                      <td className="px-4 py-2 border">Maximum number of items to return (default: 100)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border font-mono">offset</td>
                      <td className="px-4 py-2 border">Number</td>
                      <td className="px-4 py-2 border">No</td>
                      <td className="px-4 py-2 border">Number of items to skip (default: 0)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Example Request */}
              <div>
                <h3 className="font-semibold mb-3">Example Request (Root)</h3>
                <CodeBlock language="http">
{`GET https://api.gauas.online/api/v1/cloud/buckets/123e4567-e89b-12d3-a456-426614174000/objects
Authorization: HMAC your-access-key:generated-signature
X-Timestamp: 1736416263`}
                </CodeBlock>
              </div>

              {/* Example Request with Path */}
              <div>
                <h3 className="font-semibold mb-3">Example Request (Specific Folder)</h3>
                <CodeBlock language="http">
{`GET https://api.gauas.online/api/v1/cloud/buckets/123e4567.../objects?path=images/2024
Authorization: HMAC your-access-key:generated-signature
X-Timestamp: 1736416263`}
                </CodeBlock>
              </div>

              {/* Response */}
              <div>
                <h3 className="font-semibold mb-3">Response (Success)</h3>
                <CodeBlock language="json">
{`{
  "success": true,
  "objects": [
    {
      "id": "folder-uuid",
      "name": "images",
      "type": "folder",
      "path": "images",
      "size": 0,
      "created_at": "2024-01-08T10:00:00Z",
      "updated_at": "2024-01-09T10:00:00Z"
    },
    {
      "id": "file-uuid",
      "name": "document.pdf",
      "type": "file",
      "path": "",
      "size": 1048576,
      "mime_type": "application/pdf",
      "created_at": "2024-01-09T10:00:00Z",
      "updated_at": "2024-01-09T10:00:00Z"
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* Delete File API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">3. Delete File API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <CopyableCode
                code="DELETE https://api.gauas.online/api/v1/cloud/buckets/:bucket_id/objects/:object_id"
                label="Endpoint"
              />

              {/* Parameters */}
              <div>
                <h3 className="font-semibold mb-3">URL Parameters</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 border">Parameter</th>
                      <th className="text-left px-4 py-2 border">Type</th>
                      <th className="text-left px-4 py-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-mono">bucket_id</td>
                      <td className="px-4 py-2 border">UUID</td>
                      <td className="px-4 py-2 border">ID of the bucket containing the file</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border font-mono">object_id</td>
                      <td className="px-4 py-2 border">UUID</td>
                      <td className="px-4 py-2 border">ID of the file to delete</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Example Request */}
              <div>
                <h3 className="font-semibold mb-3">Example Request</h3>
                <CodeBlock language="http">
{`DELETE https://api.gauas.online/api/v1/cloud/buckets/123e4567.../objects/obj-uuid
Authorization: HMAC your-access-key:generated-signature
X-Timestamp: 1736416263`}
                </CodeBlock>
              </div>

              {/* Response */}
              <div>
                <h3 className="font-semibold mb-3">Response (Success)</h3>
                <CodeBlock language="json">
{`{
  "success": true,
  "message": "Object deleted successfully"
}`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* Delete Folder API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">4. Delete Folder API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <CopyableCode
                code="DELETE https://api.gauas.online/api/v1/cloud/buckets/:bucket_id/objects/path/:path"
                label="Endpoint"
              />

              {/* Parameters */}
              <div>
                <h3 className="font-semibold mb-3">URL Parameters</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 border">Parameter</th>
                      <th className="text-left px-4 py-2 border">Type</th>
                      <th className="text-left px-4 py-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-mono">bucket_id</td>
                      <td className="px-4 py-2 border">UUID</td>
                      <td className="px-4 py-2 border">ID of the bucket containing the folder</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border font-mono">path</td>
                      <td className="px-4 py-2 border">String</td>
                      <td className="px-4 py-2 border">Folder path to delete (e.g., folder1/folder2)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Example Request */}
              <div>
                <h3 className="font-semibold mb-3">Example Request</h3>
                <CodeBlock language="http">
{`DELETE https://api.gauas.online/api/v1/cloud/buckets/123e4567.../objects/path/images/2024
Authorization: HMAC your-access-key:generated-signature
X-Timestamp: 1736416263`}
                </CodeBlock>
              </div>

              {/* Response */}
              <div>
                <h3 className="font-semibold mb-3">Response (Success)</h3>
                <CodeBlock language="json">
{`{
  "success": true,
  "message": "Folder and all contents deleted successfully"
}`}
                </CodeBlock>
              </div>

              {/* Warning */}
              <div className="border-l-4 border-red-500 dark:border-red-400 bg-card rounded-md p-4">
                <p className="text-sm font-semibold mb-1 text-red-600 dark:text-red-400">Warning</p>
                <p className="text-sm">
                  Deleting a folder will delete all files and subfolders inside it. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

