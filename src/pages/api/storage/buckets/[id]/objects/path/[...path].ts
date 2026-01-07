import type { NextApiRequest, NextApiResponse } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, path } = req.query;
  const authHeader = req.headers.authorization;
  const deviceId = req.headers["x-device-id"];

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Bucket ID is required" });
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Build path from array
    const pathParam = Array.isArray(path) ? path.join("/") : path || "";

    const response = await fetch(
      `${API_URL}/api/v1/cloud/buckets/${id}/objects/path/${encodeURIComponent(pathParam)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          ...(deviceId && { "X-Device-ID": deviceId as string }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete path" }));
      return res.status(response.status).json(error);
    }

    const data = await response.json().catch(() => ({ message: "Path deleted successfully" }));
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Delete path error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

