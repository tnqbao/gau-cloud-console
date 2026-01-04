import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonParse } from "@/lib/api-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  const { id, path: folderPath } = req.query;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Bucket ID is required" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Build URL with optional path parameter
    // API format: /api/v1/cloud/buckets/{id}/objects/{path}
    let apiUrl = `${API_URL}/api/v1/cloud/buckets/${id}/objects`;

    // Handle path parameter - can be string or array
    const pathParam = Array.isArray(folderPath) ? folderPath.join("/") : folderPath;
    if (pathParam) {
      apiUrl += `/${encodeURIComponent(pathParam)}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    try {
      const data = await safeJsonParse(response);
      return res.status(response.status).json(data || []);
    } catch (parseError: unknown) {
      const message = parseError instanceof Error ? parseError.message : "Failed to parse response";
      return res.status(500).json({ message });
    }
  } catch (error) {
    console.error("Bucket objects error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

