import type { NextApiRequest, NextApiResponse } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const deviceId = req.headers["x-device-id"] as string;

  if (!deviceId) {
    return res.status(400).json({ message: "X-Device-ID header is required" });
  }

  try {
    // Map 'name' to 'fullname' for backend API
    const { name, email, password } = req.body;
    const requestBody = {
      fullname: name,
      email,
      password,
    };

    const response = await fetch(`${API_URL}/api/v2/account/basic/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": deviceId,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
