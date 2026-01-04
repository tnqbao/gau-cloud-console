import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import FormData from "form-data";
import fs from "fs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

// Disable body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const authHeader = req.headers.authorization;
  const deviceId = req.headers["x-device-id"];

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Parse multipart form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const uploadFile = files.file?.[0];
    if (!uploadFile) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Forward to backend
    const formData = new FormData();
    formData.append("file", fs.createReadStream(uploadFile.filepath), {
      filename: uploadFile.originalFilename || "file",
      contentType: uploadFile.mimetype || "application/octet-stream",
    });

    // Add path if provided
    const path = fields.path?.[0];
    if (path) {
      formData.append("path", path);
    }

    const response = await fetch(
      `${API_URL}/api/v1/cloud/buckets/${id}/upload`,
      {
        method: "POST",
        headers: {
          ...formData.getHeaders(),
          Authorization: authHeader,
          ...(deviceId && { "X-Device-ID": deviceId as string }),
        },
        body: formData as any,
      }
    );

    // Clean up temp file
    try {
      fs.unlinkSync(uploadFile.filepath);
    } catch (e) {
      console.error("Failed to delete temp file:", e);
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying file upload:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

