import { Block, InlineSegment } from "./parser";

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

function renderBgBlock(block: Block, bgFont: string, bgColor: string, bgSize: string): string {
  const fontFamily = bgFont ? "'CoverBg'" : "'Noto Sans', sans-serif";

  if (block.type === "bg-big") {
    return `
<div id="bg-layer" style="position:absolute;inset:0;z-index:-1;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <div style="font-family:${fontFamily};font-size:${bgSize};line-height:1;white-space:nowrap;transform:rotate(${block.rotate}deg);color:${bgColor};">${block.text}</div>
</div>`;
  }

  if (block.type === "bg-repeat") {
    return `
<div id="bg-layer" style="position:absolute;inset:0;z-index:-1;overflow:hidden;">
  <div id="bg-repeat-inner" data-text="${block.text.replace(/"/g, "&quot;")}" data-rotate="${block.rotate}" data-gap="${block.gap}" style="font-family:${fontFamily};color:${bgColor};position:absolute;"></div>
</div>
<script>
(function() {
  setTimeout(function() {
    var el = document.getElementById('bg-repeat-inner');
    var body = document.body;
    var w = body.offsetWidth;
    var h = body.offsetHeight;
    var size = Math.ceil(Math.sqrt(w * w + h * h));
    var rotate = ${block.rotate};
    var gap = ${block.gap};
    var text = el.dataset.text;
    var rows = Math.ceil(size / gap) + 2;
    var chWidth = gap * 0.6;
    var repeat = Math.ceil(size / chWidth / text.length) + 2;
    var repeated = (text + '\u3000').repeat(repeat);
    var html = '';
    for (var r = 0; r < rows; r++) {
      html += '<div style="white-space:nowrap;line-height:1;margin-bottom:' + gap + 'px;font-size:${bgSize};">' + repeated + '</div>';
    }
    el.innerHTML = html;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = ((w - size) / 2) + 'px';
    el.style.top = ((h - size) / 2) + 'px';
    el.style.transform = 'rotate(' + rotate + 'deg)';
  }, 100);
})();
</script>`;
  }

  if (block.type === "bg-continuous") {
    return `
<div id="bg-layer" style="position:absolute;inset:0;z-index:-1;overflow:hidden;">
  <div id="bg-continuous-inner" style="position:absolute;font-family:${fontFamily};font-size:${bgSize};line-height:${block.gap}px;color:${bgColor};word-break:break-all;overflow:hidden;"></div>
</div>
<script>
(function() {
  setTimeout(function() {
    var el = document.getElementById('bg-continuous-inner');
    var body = document.body;
    var w = body.offsetWidth;
    var h = body.offsetHeight;
    var size = Math.ceil(Math.sqrt(w * w + h * h));
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = ((w - size) / 2) + 'px';
    el.style.top = ((h - size) / 2) + 'px';
    el.style.transform = 'rotate(${block.rotate}deg)';
    el.textContent = '${block.text.replace(/'/g, "\\'").replace(/\s+/g, "·")} ·'.repeat(100);
  }, 100);
})();
</script>`;
  }

  if (block.type === "bg-dummy") {
    return `
<div id="bg-layer" style="position:absolute;inset:0;z-index:-1;overflow:hidden;padding:12mm 10mm;">
  <div style="font-family:${fontFamily};font-size:${bgSize};color:${bgColor};text-align:justify;line-height:${block.lineHeight};">${block.text}</div>
</div>`;
  }

  return "";
}

export function render(
  blocks: Block[],
  size: string,
  linebreak: "auto" | "manual",
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
  bgFont: string,
  bgTextColor: string,
  bgSize: string,
): string {
  const pageSize = PAGE_SIZES[size] ?? PAGE_SIZES["b6"];

  const fontFaces = [
    headingFont && `@font-face { font-family: 'CoverHeading'; src: url('/fonts/title/${headingFont}'); }`,
    boldFont && `@font-face { font-family: 'CoverBold'; src: url('/fonts/bold/${boldFont}'); }`,
    regularFont && `@font-face { font-family: 'CoverRegular'; src: url('/fonts/regular/${regularFont}'); }`,
    bgFont && `@font-face { font-family: 'CoverBg'; src: url('/fonts/background/${bgFont}'); font-style: normal; }`,
  ].filter(Boolean).join("\n");

  const defaultCss = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${pageSize.width};
      height: ${pageSize.height};
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 12mm 10mm;
      overflow: hidden;
      position: relative;
    }
    h1 {
      font-family: ${headingFont ? "'CoverHeading'" : "'Noto Sans', sans-serif"};
      font-size: ${headingSize};
      line-height: 1.25;
      color: ${headingColor};
      margin-bottom: 6mm;
      position: relative;
      z-index: 1;
    }
    p {
      font-family: ${regularFont ? "'CoverRegular'" : "'Noto Sans', sans-serif"};
      font-size: ${regularSize};
      line-height: 1.7;
      color: ${regularColor};
      margin-bottom: 4mm;
      position: relative;
      z-index: 1;
    }
    strong {
      font-family: ${boldFont ? "'CoverBold'" : "'Noto Sans', sans-serif"};
      color: ${boldColor};
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 4mm 0;
      position: relative;
      z-index: 1;
    }
    .pos {
      position: absolute;
      left: 10mm;
      right: 10mm;
      font-family: ${boldFont ? "'CoverBold'" : "'Noto Sans', sans-serif"};
      font-size: ${boldSize};
      color: ${boldColor};
      z-index: 1;
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
      z-index: 1;
    }
    .vertical-left { left: 10mm; }
    .vertical-right { right: 10mm; }
  `;

  const bgBlock = blocks.find((b) =>
    b.type === "bg-big" || b.type === "bg-repeat" || b.type === "bg-continuous" || b.type === "bg-dummy"
  );
  const bgHtml = bgBlock ? renderBgBlock(bgBlock, bgFont, bgTextColor, bgSize) : "";

  const bodyLines = blocks
    .filter((b) =>
      b.type !== "bg-big" && b.type !== "bg-repeat" && b.type !== "bg-continuous" && b.type !== "bg-dummy"
    )
    .map((block) => {
      if (block.type === "divider") return `<hr>`;
      if (block.type === "heading") return `<h1>${renderSegments(block.segments)}</h1>`;
      if (block.type === "paragraph") {
        if (linebreak === "manual") {
          const segs = block.segments.map((s) =>
            s.text === " " ? { ...s, text: "<br>" } : s
          );
          return `<p>${renderSegments(segs)}</p>`;
        }
        return `<p>${renderSegments(block.segments)}</p>`;
      }
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
${defaultCss}
</style>
</head>
<body>
${bgHtml}
${bodyLines.join("\n")}
</body>
</html>`;
}
