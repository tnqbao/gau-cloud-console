import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonParse } from "@/lib/api-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const response = await fetch(`${API_URL}/api/v1/cloud/buckets`, {
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
    }

    if (req.method === "POST") {
      const response = await fetch(`${API_URL}/api/v1/cloud/buckets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(req.body),
      });

      try {
        const data = await safeJsonParse(response);
        return res.status(response.status).json(data || { message: "Success" });
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : "Failed to parse response";
        return res.status(500).json({ message });
      }
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Buckets error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

