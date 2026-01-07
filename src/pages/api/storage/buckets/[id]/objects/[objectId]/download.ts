import type { NextApiRequest, NextApiResponse } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, objectId } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!id || typeof id !== "string" || !objectId || typeof objectId !== "string") {
    return res.status(400).json({ message: "Bucket ID and Object ID are required" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/cloud/buckets/${id}/objects/${objectId}/download`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to download object" }));
      return res.status(response.status).json(error);
    }

    // Stream the file
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") || "";
    const contentLength = response.headers.get("content-length") || "";

    res.setHeader("Content-Type", contentType);
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    }
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    // Stream response
    if (response.body) {
      const reader = response.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      });

      // Convert ReadableStream to Node.js stream
      const nodeStream = stream as any;
      if (nodeStream.pipe) {
        nodeStream.pipe(res);
      } else {
        // Fallback for environments without pipe
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Download object error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

