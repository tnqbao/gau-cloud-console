import type { NextApiRequest, NextApiResponse } from "next";

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

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/cloud/buckets/${id}/objects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Bucket objects error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

