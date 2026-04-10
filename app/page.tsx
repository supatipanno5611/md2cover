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
const UNITS = ["rem", "px", "pt"];

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
  const [boldSize, setBoldSize] = useState("1.1");
  const [boldUnit, setBoldUnit] = useState("rem");
  const [regularSize, setRegularSize] = useState("1.1");
  const [regularUnit, setRegularUnit] = useState("rem");
  const [headingFont, setHeadingFont] = useState("");
  const [headingColor, setHeadingColor] = useState("#111111");
  const [headingSize, setHeadingSize] = useState("2.4");
  const [headingUnit, setHeadingUnit] = useState("rem");
  const [bgColor, setBgColor] = useState("#ffffff");
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

  const buildHtml = useCallback((
    md: string,
    bold: string, regular: string,
    boldCol: string, regularCol: string,
    bSize: string, rSize: string,
    heading: string, headingCol: string, hSize: string,
    bg: string,
  ) => {
    const { frontmatter, blocks } = parse(md);
    return render(blocks, frontmatter, bold, regular, boldCol, regularCol, bSize, rSize, heading, headingCol, hSize, bg);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { frontmatter } = parse(markdown);
      setPageSize(PAGE_SIZES[frontmatter.size ?? "b6"]);
      setPreviewHtml(buildHtml(
        markdown,
        boldFont, regularFont,
        boldColor, regularColor,
        `${boldSize}${boldUnit}`, `${regularSize}${regularUnit}`,
        headingFont, headingColor, `${headingSize}${headingUnit}`,
        bgColor,
      ));
    }, 300);
  }, [
    markdown, boldFont, regularFont, boldColor, regularColor,
    boldSize, boldUnit, regularSize, regularUnit,
    headingFont, headingColor, headingSize, headingUnit,
    buildHtml, bgColor,
  ]);

  const handlePrint = () => {
    const html = buildHtml(
      markdown,
      boldFont, regularFont,
      boldColor, regularColor,
      `${boldSize}${boldUnit}`, `${regularSize}${regularUnit}`,
      headingFont, headingColor, `${headingSize}${headingUnit}`,
      bgColor,
    );
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
          <input type="number" value={boldSize} onChange={(e) => setBoldSize(e.target.value)} className="size-input" step="0.1" min="0.1" />
          <select value={boldUnit} onChange={(e) => setBoldUnit(e.target.value)} className="font-select">
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input type="text" value={boldColor} onChange={(e) => setBoldColor(e.target.value)} className="color-input" />
        </label>
        <label className="font-label">
          흐림체
          <select value={regularFont} onChange={(e) => setRegularFont(e.target.value)} className="font-select">
            <option value="">Noto Sans</option>
            {regularFonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="number" value={regularSize} onChange={(e) => setRegularSize(e.target.value)} className="size-input" step="0.1" min="0.1" />
          <select value={regularUnit} onChange={(e) => setRegularUnit(e.target.value)} className="font-select">
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input type="text" value={regularColor} onChange={(e) => setRegularColor(e.target.value)} className="color-input" />
        </label>
      </div>

      <div className="toolbar">
        <label className="font-label">
          제목체
          <select value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} className="font-select">
            <option value="">Noto Sans</option>
            {boldFonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="number" value={headingSize} onChange={(e) => setHeadingSize(e.target.value)} className="size-input" step="0.1" min="0.1" />
          <select value={headingUnit} onChange={(e) => setHeadingUnit(e.target.value)} className="font-select">
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input type="text" value={headingColor} onChange={(e) => setHeadingColor(e.target.value)} className="color-input" />
        </label>
        <label className="font-label">
          배경색
          <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="color-input" />
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
