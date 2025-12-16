import type { NextApiRequest, NextApiResponse } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const deviceId = req.headers["x-device-id"] as string;

  try {
    const response = await fetch(`${API_URL}/api/v2/account/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
        ...(deviceId && { "X-Device-ID": deviceId }),
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
