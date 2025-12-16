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

  try {
    if (req.method === "GET") {
      const response = await fetch(`${API_URL}/api/v1/cloud/buckets/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
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

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Bucket error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

