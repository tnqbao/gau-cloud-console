import type { NextApiRequest, NextApiResponse } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const deviceId = req.headers["x-device-id"] as string;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!deviceId) {
    return res.status(400).json({ message: "X-Device-ID header is required" });
  }

  try {
    const response = await fetch(`${API_URL}/api/v2/account/profile/basic`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "X-Device-ID": deviceId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
