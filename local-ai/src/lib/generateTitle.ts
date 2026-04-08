export function generateTitleFromMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return 'New Chat';
  }

  let title = trimmed.slice(0, 50);

  if (trimmed.length > 50) {
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 20) {
      title = title.slice(0, lastSpace);
    }

    title += '...';
  }

  return title;
}
