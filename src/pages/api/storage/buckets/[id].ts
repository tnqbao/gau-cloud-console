import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonParse } from "@/lib/api-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  const { id } = req.query;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Bucket ID is required" });
  }

  try {
    if (req.method === "GET") {
      const response = await fetch(`${API_URL}/api/v1/cloud/buckets/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      });

      // If 404, try to get bucket info from list endpoint
      if (response.status === 404) {
        try {
          const listResponse = await fetch(`${API_URL}/api/v1/cloud/buckets`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
          });

          const listData = await safeJsonParse(listResponse);
          if (listData && typeof listData === 'object' && 'buckets' in listData) {
            const buckets = (listData as { buckets: Array<{ id: string; name: string }> }).buckets;
            const bucket = buckets.find((b: { id: string }) => b.id === id);
            if (bucket) {
              return res.status(200).json(bucket);
            }
          }
        } catch {
          // Fallback to 404
        }
        return res.status(404).json({ message: "Bucket not found" });
      }

      try {
        const data = await safeJsonParse(response);
        return res.status(response.status).json(data || { message: "Empty response" });
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : "Failed to parse response";
        return res.status(500).json({ message });
      }
    }

    if (req.method === "DELETE") {
      const response = await fetch(`${API_URL}/api/v1/cloud/buckets/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      });

      if (response.status === 204) {
        return res.status(204).end();
      }

      try {
        const data = await safeJsonParse(response);
        if (data) {
          return res.status(response.status).json(data);
        }
        return res.status(response.status).end();
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : "Failed to parse response";
        return res.status(500).json({ message });
      }
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Bucket error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

