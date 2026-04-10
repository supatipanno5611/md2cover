import matter from "gray-matter";

export type InlineSegment = { text: string; bold: boolean };
export type Block =
  | { type: "heading"; segments: InlineSegment[] }
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "block"; align: "left" | "center" | "right" | "justify"; segments: InlineSegment[] }
  | { type: "divider" };

export interface Frontmatter {
  size?: "b6" | "a5" | "ma5";
  linebreak?: "auto" | "manual";
  align?: "top" | "middle" | "bottom";
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
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    const fenceMatch = trimmed.match(/^```(left|center|right|justify|left-br|center-br|right-br|justify-br)$/);
    if (fenceMatch) {
      const tag = fenceMatch[1];
      const forceBr = tag.endsWith("-br");
      const align = tag.replace("-br", "") as "left" | "center" | "right" | "justify";
      const sep = forceBr ? "<br>" : (frontmatter.linebreak === "manual" ? "<br>" : " ");

      i++;
      const segments: InlineSegment[] = [];
      while (i < lines.length && lines[i].trim() !== "```") {
        const lineTrimmed = lines[i].trim();
        if (lineTrimmed) {
          if (segments.length > 0) segments.push({ text: sep, bold: false });
          segments.push(...parseInline(lineTrimmed));
        }
        i++;
      }
      if (segments.length > 0) blocks.push({ type: "block", align, segments });
      i++;
      continue;
    }

    if (!trimmed) { i++; continue; }
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
    i++;
  }

  return { frontmatter, blocks };
}
