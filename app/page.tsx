"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { parse } from "@/lib/parser";
import { render, PAGE_SIZES } from "@/lib/renderer";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const DEFAULT_MD = `---
size: b6
linebreak: auto
align: top
---

# 제목을 입력하세요.

원하는 결과물을 만들기 위해 **필요한 효과와 기술만 간결하게** 사용하며 **빠른 작업 속도**를 추구합니다. 그 이후엔 필요 없는 **절차는 모두 과감히 생략**하고 기존의 목표에만 충실할 수 있도록 주의를 기울입니다.
`;

const MM_TO_CSS_PX = 96 / 25.4;

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [previewHtml, setPreviewHtml] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZES["b6"]);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [boldFonts, setBoldFonts] = useState<string[]>([]);
  const [regularFonts, setRegularFonts] = useState<string[]>([]);
  const [boldFont, setBoldFont] = useState("");
  const [regularFont, setRegularFont] = useState("");
  const [boldColor, setBoldColor] = useState("#111111");
  const [regularColor, setRegularColor] = useState("#888888");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then((data) => {
        setBoldFonts(data.bold);
        setRegularFonts(data.regular);
      });
  }, []);

  const buildHtml = useCallback(async (md: string, bold: string, regular: string, boldCol: string, regularCol: string) => {
    const { frontmatter, blocks } = parse(md);
    let customCss: string | undefined;
    if (frontmatter.css) {
      try {
        const res = await fetch(`/templates/${frontmatter.css}`);
        if (res.ok) customCss = await res.text();
      } catch {}
    }
    return render(blocks, frontmatter, bold, regular, boldCol, regularCol, customCss);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { frontmatter } = parse(markdown);
      setPageSize(PAGE_SIZES[frontmatter.size ?? "b6"]);
      setPreviewHtml(await buildHtml(markdown, boldFont, regularFont, boldColor, regularColor));
    }, 300);
  }, [markdown, boldFont, regularFont, boldColor, regularColor, buildHtml]);

  const handlePrint = async () => {
    const html = await buildHtml(markdown, boldFont, regularFont, boldColor, regularColor);
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

  return (
    <div id="app">
      <iframe ref={printFrameRef} style={{ display: "none" }} title="print-frame" />

      <header className="header">
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

      <div className="toolbar">
        <label className="font-label">
          강조체
          <select value={boldFont} onChange={(e) => setBoldFont(e.target.value)} className="font-select">
            <option value="">Noto Sans</option>
            {boldFonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="color" value={boldColor} onChange={(e) => setBoldColor(e.target.value)} className="color-swatch" />
          <input type="text" value={boldColor} onChange={(e) => setBoldColor(e.target.value)} className="color-input" />
        </label>
        <label className="font-label">
          흐림체
          <select value={regularFont} onChange={(e) => setRegularFont(e.target.value)} className="font-select">
            <option value="">Noto Sans</option>
            {regularFonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="color" value={regularColor} onChange={(e) => setRegularColor(e.target.value)} className="color-swatch" />
          <input type="text" value={regularColor} onChange={(e) => setRegularColor(e.target.value)} className="color-input" />
        </label>
      </div>

      <div className={`panel${tab === "editor" ? "" : " hidden"}`}>
        <div className="editor-wrap">
          <Editor value={markdown} onChange={setMarkdown} />
        </div>
      </div>

      <div className={`panel${tab === "preview" ? "" : " hidden"}`}>
        <div className="preview-scroll">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              style={{ border: "none", width: `${realW}px`, height: `${realH}px` }}
              title="preview"
              className="preview-shadow"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
