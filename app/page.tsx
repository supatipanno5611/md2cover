"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { parse } from "@/lib/parser";
import { render, PAGE_SIZES } from "@/lib/renderer";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const DEFAULT_MD = `---
size: b6
linebreak: auto
boldfont: 
regularfont: 
text-option: top
---

# 리틱인더스트리는 효율을 중시합니다.

원하는 결과물을 만들기 위해 **필요한 효과와 기술만 간결하게** 사용하며 **빠른 작업 속도**를 추구합니다. 그 이후엔 필요 없는 **절차는 모두 과감히 생략**하고 기존의 목표에만 충실할 수 있도록 주의를 기울입니다.

---
`;

const MM_TO_CSS_PX = 96 / 25.4;

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [previewHtml, setPreviewHtml] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZES["b6"]);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [scaleMode, setScaleMode] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const buildHtml = useCallback(async (md: string) => {
    const { frontmatter, blocks } = parse(md);
    let customCss: string | undefined;
    if (frontmatter.css) {
      try {
        const res = await fetch(`/templates/${frontmatter.css}`);
        if (res.ok) customCss = await res.text();
      } catch {}
    }
    return render(blocks, frontmatter, customCss);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { frontmatter } = parse(markdown);
      setPageSize(PAGE_SIZES[frontmatter.size ?? "b6"]);
      setPreviewHtml(await buildHtml(markdown));
    }, 300);
  }, [markdown, buildHtml]);

  const handlePrint = async () => {
    const html = await buildHtml(markdown);
    const frame = printFrameRef.current;
    if (!frame) return;
    frame.srcdoc = html;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    };
  };

  const realW = parseFloat(pageSize.width) * MM_TO_CSS_PX;
  const realH = parseFloat(pageSize.height) * MM_TO_CSS_PX;
  const containerW = previewContainerRef.current?.clientWidth ?? 600;
  const scale = (containerW - 64) / realW;
  const scaledH = realH * scale;

  return (
    <div id="app">
      <iframe ref={printFrameRef} style={{ display: "none" }} title="print-frame" />

      <header className="header">
        <span className="header-title">md2cover</span>

        <div className="tab-group">
          {(["editor", "preview"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn${tab === t ? " active" : ""}`}
            >
              {t === "editor" ? "에디터" : "미리보기"}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={handlePrint}>
          PDF 내보내기
        </button>
      </header>

      <div className={`panel${tab === "editor" ? "" : " hidden"}`}>
        <div className="editor-wrap">
          <Editor value={markdown} onChange={setMarkdown} />
        </div>
      </div>

      <div className={`panel${tab === "preview" ? "" : " hidden"}`}>
        <div className="preview-toolbar">
          {(["실물 크기", "전체 보기"] as const).map((label, i) => {
            const isScale = i === 1;
            return (
              <button
                key={label}
                onClick={() => setScaleMode(isScale)}
                className={`view-btn${scaleMode === isScale ? " active" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div ref={previewContainerRef} className="preview-scroll">
          {previewHtml ? (
            scaleMode ? (
              <div style={{ width: `${containerW - 64}px`, height: `${scaledH}px`, flexShrink: 0 }}>
                <iframe
                  srcDoc={previewHtml}
                  style={{ border: "none", width: `${realW}px`, height: `${realH}px`, transform: `scale(${scale})`, transformOrigin: "top left" }}
                  title="preview"
                  className="preview-shadow"
                />
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                style={{ border: "none", width: `${realW}px`, height: `${realH}px` }}
                title="preview"
                className="preview-shadow"
              />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
