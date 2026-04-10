import matter from "gray-matter";

export type InlineSegment = { text: string; bold: boolean };

export type Block =
  | { type: "heading"; segments: InlineSegment[] }
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "flow"; align: "left" | "center" | "right" | "justify"; segments: InlineSegment[] }
  | { type: "position"; placement: "top" | "bottom"; align: "left" | "center" | "right" | "justify"; segments: InlineSegment[] }
  | { type: "vertical"; side: "left" | "right"; chars: string[] }
  | { type: "divider" }
  | { type: "bg-big"; rotate: number; text: string }
  | { type: "bg-repeat"; rotate: number; gap: number; text: string }
  | { type: "bg-continuous"; rotate: number; gap: number; text: string }
  | { type: "bg-dummy"; lineHeight: number; text: string };

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

const FLOW_ALIGNS = ["left", "center", "right", "justify"] as const;
const FLOW_ALIGNS_BR = ["left-br", "center-br", "right-br", "justify-br"] as const;
type FlowAlign = typeof FLOW_ALIGNS[number];

export function parse(raw: string): { frontmatter: Frontmatter; blocks: Block[]; bgWarning: boolean } {
  const { data, content } = matter(raw);
  const frontmatter = data as Frontmatter;
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let bgCount = 0;

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    const fenceMatch = trimmed.match(/^```(.+)$/);
    if (fenceMatch) {
      const tag = fenceMatch[1];

      const bgBigMatch = tag.match(/^bg-big-(-?\d+)$/);
      const bgRepeatMatch = tag.match(/^bg-repeat-(-?\d+)-(\d+)$/);
      const bgContinuousMatch = tag.match(/^bg-continuous-(-?\d+)-(\d+)$/);
      const bgDummyMatch = tag.match(/^bg-dummy-(\d+(?:\.\d+)?)$/);

      if (bgBigMatch || bgRepeatMatch || bgContinuousMatch || bgDummyMatch) {
        bgCount++;
        i++;
        const bodyLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== "```") {
          bodyLines.push(lines[i]);
          i++;
        }
        const text = bodyLines.join("\n").trim();
        if (bgBigMatch) {
          blocks.push({ type: "bg-big", rotate: Number(bgBigMatch[1]), text });
        } else if (bgRepeatMatch) {
          blocks.push({ type: "bg-repeat", rotate: Number(bgRepeatMatch[1]), gap: Number(bgRepeatMatch[2]), text });
        } else if (bgContinuousMatch) {
          blocks.push({ type: "bg-continuous", rotate: Number(bgContinuousMatch[1]), gap: Number(bgContinuousMatch[2]), text });
        } else if (bgDummyMatch) {
          blocks.push({ type: "bg-dummy", lineHeight: Number(bgDummyMatch[1]), text });
        }
        i++;
        continue;
      }

      if (tag === "left-vertical" || tag === "right-vertical") {
        const side = tag === "left-vertical" ? "left" : "right";
        i++;
        const chars: string[] = [];
        while (i < lines.length && lines[i].trim() !== "```") {
          for (const ch of lines[i]) chars.push(ch);
          i++;
        }
        if (chars.length > 0) blocks.push({ type: "vertical", side, chars });
        i++;
        continue;
      }

      const posMatch = tag.match(/^(top|bottom)-(left|center|right|justify)$/);
      if (posMatch) {
        const placement = posMatch[1] as "top" | "bottom";
        const align = posMatch[2] as "left" | "center" | "right" | "justify";
        i++;
        const segments: InlineSegment[] = [];
        while (i < lines.length && lines[i].trim() !== "```") {
          const lineTrimmed = lines[i].trim();
          if (lineTrimmed) {
            if (segments.length > 0) segments.push({ text: " ", bold: false });
            segments.push(...parseInline(lineTrimmed));
          }
          i++;
        }
        if (segments.length > 0) blocks.push({ type: "position", placement, align, segments });
        i++;
        continue;
      }

      const forceBr = (FLOW_ALIGNS_BR as readonly string[]).includes(tag);
      const baseTag = tag.replace("-br", "");
      if ((FLOW_ALIGNS as readonly string[]).includes(baseTag)) {
        const align = baseTag as FlowAlign;
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
        if (segments.length > 0) blocks.push({ type: "flow", align, segments });
        i++;
        continue;
      }

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

  return { frontmatter, blocks, bgWarning: bgCount > 1 };
}
