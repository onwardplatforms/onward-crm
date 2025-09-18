// Convert internal mention format to display format
export function formatMentionsForDisplay(text: string | null | undefined): string {
  if (!text) return "";
  // Replace @[Name](id) with just @Name
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
}