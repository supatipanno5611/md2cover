import { Block, Frontmatter, InlineSegment } from "./parser";

export const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  b6: { width: "128mm", height: "182mm" },
  gukpan: { width: "148mm", height: "210mm" },
  singukpan: { width: "153mm", height: "225mm" },
};

function renderSegments(segments: InlineSegment[]): string {
  return segments
    .map((s) => s.bold ? `<strong>${s.text}</strong>` : `<span>${s.text}</span>`)
    .join("");
}

export function render(
  blocks: Block[],
  frontmatter: Frontmatter,
  customCss?: string
): string {
  const size = PAGE_SIZES[frontmatter.size ?? "b6"];
  const textOption = frontmatter["text-option"] ?? "top";
  const boldFont = frontmatter.boldfont ?? "";
  const regularFont = frontmatter.regularfont ?? "";

  const alignMap = { top: "flex-start", middle: "center", bottom: "flex-end" };
  const justifyContent = alignMap[textOption];

  const fontFaces = [
    boldFont && `@font-face { font-family: 'CoverBold'; src: url('/fonts/${boldFont}'); }`,
    regularFont && `@font-face { font-family: 'CoverRegular'; src: url('/fonts/${regularFont}'); }`,
  ].filter(Boolean).join("\n");

  const defaultCss = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${size.width};
      height: ${size.height};
      background: #fff;
      display: flex;
      flex-direction: column;
      justify-content: ${justifyContent};
      padding: 12mm 10mm;
      overflow: hidden;
    }
    h1 {
      font-family: ${boldFont ? "'CoverBold'" : "sans-serif"};
      font-weight: 900;
      font-size: 2.4rem;
      line-height: 1.25;
      color: #111;
      margin-bottom: 6mm;
    }
    p {
      font-family: ${regularFont ? "'CoverRegular'" : "sans-serif"};
      font-weight: 300;
      font-size: 1.1rem;
      line-height: 1.7;
      color: #888;
      margin-bottom: 4mm;
    }
    strong {
      font-family: ${boldFont ? "'CoverBold'" : "sans-serif"};
      font-weight: 900;
      color: #111;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 4mm 0;
    }
  `;

  const bodyLines = blocks.map((block) => {
    if (block.type === "divider") return `<hr>`;
    if (block.type === "heading") return `<h1>${renderSegments(block.segments)}</h1>`;
    return `<p>${renderSegments(block.segments)}</p>`;
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
