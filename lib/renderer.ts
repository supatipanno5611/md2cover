import { Block, Frontmatter, InlineSegment } from "./parser";

export const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  b6: { width: "128mm", height: "182mm" },
  a5: { width: "148mm", height: "210mm" },
  ma5: { width: "153mm", height: "225mm" },
};

function renderSegments(segments: InlineSegment[]): string {
  return segments
    .map((s) => s.bold ? `<strong>${s.text}</strong>` : `<span>${s.text}</span>`)
    .join("");
}

export function render(
  blocks: Block[],
  frontmatter: Frontmatter,
  boldFont: string,
  regularFont: string,
  boldColor: string,
  regularColor: string,
  boldSize: string,
  regularSize: string,
  headingFont: string,
  headingColor: string,
  headingSize: string,
  bgColor: string,
  customCss?: string
): string {
  const size = PAGE_SIZES[frontmatter.size ?? "b6"];
  const textOption = frontmatter.align ?? "top";
  const alignMap = { top: "flex-start", middle: "center", bottom: "flex-end" };
  const justifyContent = alignMap[textOption];

  const fontFaces = [
    boldFont && `@font-face { font-family: 'CoverBold'; src: url('/fonts/bold/${boldFont}'); }`,
    regularFont && `@font-face { font-family: 'CoverRegular'; src: url('/fonts/regular/${regularFont}'); }`,
  ].filter(Boolean).join("\n");

  const defaultCss = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${size.width};
      height: ${size.height};
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      justify-content: ${justifyContent};
      padding: 12mm 10mm;
      overflow: hidden;
      position: relative;
    }
    h1 {
      font-family: ${headingFont ? "'CoverBold'" : "'Noto Sans', sans-serif"};
      font-size: ${headingSize};
      line-height: 1.25;
      color: ${headingColor};
      margin-bottom: 6mm;
    }
    p {
      font-family: ${regularFont ? "'CoverRegular'" : "'Noto Sans', sans-serif"};
      font-size: ${regularSize};
      line-height: 1.7;
      color: ${regularColor};
      margin-bottom: 4mm;
    }
    strong {
      font-family: ${boldFont ? "'CoverBold'" : "'Noto Sans', sans-serif"};
      color: ${boldColor};
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 4mm 0;
    }
    .pos {
      position: absolute;
      left: 10mm;
      right: 10mm;
      font-family: ${boldFont ? "'CoverBold'" : "'Noto Sans', sans-serif"};
      font-size: ${boldSize};
      color: ${boldColor};
    }
    .pos-top { top: 12mm; }
    .pos-bottom { bottom: 12mm; }
    .pos-left { text-align: left; }
    .pos-center { text-align: center; }
    .pos-right { text-align: right; }
    .pos-justify { text-align: justify; }
    .vertical {
      position: absolute;
      top: 12mm;
      bottom: 12mm;
      display: flex;
      flex-direction: column;
      font-family: ${boldFont ? "'CoverBold'" : "'Noto Sans', sans-serif"};
      font-size: ${boldSize};
      color: ${boldColor};
      line-height: 1.25;
      justify-content: center;
    }
    .vertical-left { left: 10mm; }
    .vertical-right { right: 10mm; }
  `;

  const bodyLines = blocks.map((block) => {
    if (block.type === "divider") return `<hr>`;
    if (block.type === "heading") return `<h1>${renderSegments(block.segments)}</h1>`;
    if (block.type === "paragraph") return `<p>${renderSegments(block.segments)}</p>`;
    if (block.type === "flow") return `<p style="text-align:${block.align}">${renderSegments(block.segments)}</p>`;
    if (block.type === "position") {
      return `<p class="pos pos-${block.placement} pos-${block.align}">${renderSegments(block.segments)}</p>`;
    }
    if (block.type === "vertical") {
      const charSpans = block.chars.map((ch) => `<span>${ch}</span>`).join("\n");
      return `<div class="vertical vertical-${block.side}">${charSpans}</div>`;
    }
    return "";
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${fontFaces}
${customCss ?? defaultCss}
</style>
</head>
<body>
${bodyLines.join("\n")}
</body>
</html>`;
}
