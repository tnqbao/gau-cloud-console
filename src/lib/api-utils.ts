/**
 * Safely parse JSON response from API
 * Handles empty responses and invalid JSON
 */
export async function safeJsonParse(response: Response): Promise<unknown> {
  const text = await response.text();

  // Handle empty responses
  if (!text || text.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON parse error:", error);
    console.error("Response text:", text.substring(0, 200)); // Log first 200 chars
    throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
  }
}

