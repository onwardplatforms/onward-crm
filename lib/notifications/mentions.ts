// Client-side helper to create mention notifications via API
export async function createMentionNotifications(
  mentions: string[],
  mentionerName: string,
  contextType: "activity" | "deal" | "contact" | "company",
  contextId: string,
  contextName: string,
  workspaceId: string,
  message?: string
) {
  if (mentions.length === 0) {
    return [];
  }

  try {
    const response = await fetch("/api/notifications/mentions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mentions,
        mentionerName,
        contextType,
        contextId,
        contextName,
        workspaceId,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create mention notifications:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error("Error creating mention notifications:", error);
    return [];
  }
}