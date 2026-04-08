export function prepareTextForSpeech(rawMessage: string): string {
  let text = rawMessage || '';

  text = text.replace(/```[\s\S]*?```/g, ' Code block omitted. ');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/!\[[^\]]*\]\(([^)]+)\)/g, ' image ');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  text = text.replace(/https?:\/\/\S+/g, ' link omitted ');

  // Remove markdown emphasis markers so Piper does not read them as symbols.
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Headings and horizontal rules.
  text = text.replace(/^#{1,6}\s*/gm, '');
  text = text.replace(/^([-*_]){3,}\s*$/gm, ' ');

  // Convert list bullets into natural pauses instead of reading asterisks or dashes.
  text = text.replace(/^\s*[-*+]\s+/gm, ' - ');
  text = text.replace(/^\s*\d+\.\s+/gm, ' - ');

  // Tables and separators become softer punctuation.
  text = text.replace(/\|/g, ', ');
  text = text.replace(/\s*[:]{2,}\s*/g, ': ');

  // Remove stray markdown control characters that survive the targeted cleanup.
  text = text.replace(/[<>]/g, ' ');

  // Emoji and decorative symbols often sound awkward or get spoken literally.
  text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, ' ');
  text = text.replace(/[•??????????????????????]/gu, ' ');

  // Normalize whitespace and pauses.
  text = text.replace(/\r/g, '\n');
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/\n/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/\s+([,.;!?])/g, '$1');
  text = text.replace(/([,;:])(?=[^ ])/g, '$1 ');
  text = text.replace(/([.!?])(?=[A-Z])/g, '$1 ');

  // Avoid empty or symbol-only output.
  text = text.trim();

  return text || 'No readable text was available for voice output.';
}
