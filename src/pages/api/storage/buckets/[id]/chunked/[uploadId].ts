import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonParse } from "@/lib/api-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  const { id, uploadId } = req.query;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Bucket ID is required" });
  }

  if (!uploadId || typeof uploadId !== "string") {
    return res.status(400).json({ message: "Upload ID is required" });
  }

  if (req.method === "GET") {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/cloud/buckets/${id}/chunked/${uploadId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );

      try {
        const data = await safeJsonParse(response);
        return res.status(response.status).json(data || { message: "Empty response" });
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : "Failed to parse response";
        return res.status(500).json({ message });
      }
    } catch (error) {
      console.error("Chunked status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    // Abort upload
    try {
      const response = await fetch(
        `${API_URL}/api/v1/cloud/buckets/${id}/chunked/${uploadId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );

      try {
        const data = await safeJsonParse(response);
        return res.status(response.status).json(data || { message: "Deleted" });
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : "Failed to parse response";
        return res.status(500).json({ message });
      }
    } catch (error) {
      console.error("Chunked abort error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

