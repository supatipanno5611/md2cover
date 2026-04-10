import matter from "gray-matter";

export type InlineSegment = { text: string; bold: boolean };
export type Block =
  | { type: "heading"; segments: InlineSegment[] }
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "divider" };

export interface Frontmatter {
  size?: "b6" | "a5" | "ma5";
  linebreak?: "auto" | "manual";
  align?: "top" | "middle" | "bottom";
  css?: string;
}

function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), bold: false });
    segments.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), bold: false });
  return segments;
}

export function parse(raw: string): { frontmatter: Frontmatter; blocks: Block[] } {
  const { data, content } = matter(raw);
  const frontmatter = data as Frontmatter;
  const blocks: Block[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "---") {
      blocks.push({ type: "divider" });
    } else if (trimmed.startsWith("# ")) {
      blocks.push({ type: "heading", segments: parseInline(trimmed.slice(2)) });
    } else {
      const last = blocks[blocks.length - 1];
      if (last?.type === "paragraph") {
        const sep = frontmatter.linebreak === "manual" ? "<br>" : " ";
        last.segments.push({ text: sep, bold: false }, ...parseInline(trimmed));
      } else {
        blocks.push({ type: "paragraph", segments: parseInline(trimmed) });
      }
    }
  }

  return { frontmatter, blocks };
}
