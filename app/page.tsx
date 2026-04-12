"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { parse } from "@/lib/parser";
import { render, PAGE_SIZES } from "@/lib/renderer";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const DEFAULT_MD = `# 제목을 입력하세요.

원하는 결과물을 만들기 위해 **필요한 효과와 기술만 간결하게** 사용하며 **빠른 작업 속도**를 추구합니다. 그 이후엔 필요 없는 **절차는 모두 과감히 생략**하고 기존의 목표에만 충실할 수 있도록 주의를 기울입니다.
// 이렇게 슬래시 두 번으로 시작하는 행은 주석 처리되어 화면에 나타나지 않습니다.
`;

const SIZE_ORDER = ["b6", "a5", "ma5"] as const;
type SizeKey = typeof SIZE_ORDER[number];
const UNITS = ["rem", "px", "pt"] as const;
type ToolTab = "heading" | "bold" | "regular" | "bg" | "etc" | "template";

const MM_TO_CSS_PX = 96 / 25.4;

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [previewHtml, setPreviewHtml] = useState("");
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [toolTab, setToolTab] = useState<ToolTab | null>(null);

  const [size, setSize] = useState<SizeKey>("b6");
  const [linebreak, setLinebreak] = useState<"auto" | "manual">("auto");
  const [pageColor, setPageColor] = useState("#ffffff");

  const [boldFonts, setBoldFonts] = useState<string[]>([]);
  const [regularFonts, setRegularFonts] = useState<string[]>([]);
  const [bgFonts, setBgFonts] = useState<string[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);

  const [headingFont, setHeadingFont] = useState("");
  const [headingColor, setHeadingColor] = useState("#111111");
  const [headingSize, setHeadingSize] = useState("2.4");
  const [headingUnit, setHeadingUnit] = useState("rem");

  const [boldFont, setBoldFont] = useState("");
  const [boldColor, setBoldColor] = useState("#111111");
  const [boldSize, setBoldSize] = useState("1.1");
  const [boldUnit, setBoldUnit] = useState("rem");

  const [regularFont, setRegularFont] = useState("");
  const [regularColor, setRegularColor] = useState("#888888");
  const [regularSize, setRegularSize] = useState("1.1");
  const [regularUnit, setRegularUnit] = useState("rem");

  const [bgFont, setBgFont] = useState("");
  const [bgTextColor, setBgTextColor] = useState("#eeeeee");
  const [bgSize, setBgSize] = useState("1.0");
  const [bgUnit, setBgUnit] = useState("rem");

  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then((data) => {
        setBoldFonts(data.bold);
        setRegularFonts(data.regular);
        setBgFonts(data.background);
      });
  }, []);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);

  const buildHtml = useCallback((md: string) => {
    const { blocks } = parse(md);
    return render(
      blocks,
      size, linebreak,
      boldFont, regularFont,
      boldColor, regularColor,
      `${boldSize}${boldUnit}`, `${regularSize}${regularUnit}`,
      headingFont, headingColor, `${headingSize}${headingUnit}`,
      pageColor, bgFont, bgTextColor, `${bgSize}${bgUnit}`,
    );
  }, [
    size, linebreak, pageColor,
    boldFont, regularFont, boldColor, regularColor, boldSize, boldUnit, regularSize, regularUnit,
    headingFont, headingColor, headingSize, headingUnit,
    bgFont, bgTextColor, bgSize, bgUnit,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(buildHtml(markdown));
    }, 300);
  }, [markdown, buildHtml]);

  const handlePrint = () => {
    const html = buildHtml(markdown);
    const frame = printFrameRef.current;
    if (!frame) return;
    frame.srcdoc = html;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    };
  };

  const cycleSize = () => {
    setSize((s) => SIZE_ORDER[(SIZE_ORDER.indexOf(s) + 1) % SIZE_ORDER.length]);
  };

  const toggleToolTab = (t: ToolTab) => setToolTab((prev) => prev === t ? null : t);

  const pageSize = PAGE_SIZES[size];
  const realW = parseFloat(pageSize.width) * MM_TO_CSS_PX;
  const realH = parseFloat(pageSize.height) * MM_TO_CSS_PX;

  const TOOL_TABS: { key: ToolTab; label: string }[] = [
    { key: "heading", label: "제목" },
    { key: "bold", label: "강조" },
    { key: "regular", label: "흐림" },
    { key: "bg", label: "배경" },
    { key: "etc", label: "기타" },
    { key: "template", label: "템플릿" },
  ];

  const fontConfigs = {
    heading: { label: "제목체", fonts: boldFonts, font: headingFont, setFont: setHeadingFont, color: headingColor, setColor: setHeadingColor, size: headingSize, setSize: setHeadingSize, unit: headingUnit, setUnit: setHeadingUnit },
    bold:    { label: "강조체", fonts: boldFonts, font: boldFont, setFont: setBoldFont, color: boldColor, setColor: setBoldColor, size: boldSize, setSize: setBoldSize, unit: boldUnit, setUnit: setBoldUnit },
    regular: { label: "흐림체", fonts: regularFonts, font: regularFont, setFont: setRegularFont, color: regularColor, setColor: setRegularColor, size: regularSize, setSize: setRegularSize, unit: regularUnit, setUnit: setRegularUnit },
    bg:      { label: "배경체", fonts: bgFonts, font: bgFont, setFont: setBgFont, color: bgTextColor, setColor: setBgTextColor, size: bgSize, setSize: setBgSize, unit: bgUnit, setUnit: setBgUnit },
  };

  function renderSettingsRow() {
    if (!toolTab) return null;

    if (toolTab === "template") return (
      <div className="settings-row">
        {templates.length === 0 && (
          <span className="font-label">public/templates/ 에 .md 파일을 추가하세요</span>
        )}
        {templates.map((f) => (
          <button
            key={f}
            className="btn-toggle"
            onClick={() =>
              fetch(`/templates/${encodeURIComponent(f)}`)
                .then((r) => r.text())
                .then(setMarkdown)
            }
          >
            {f.replace(/\.md$/, "")}
          </button>
        ))}
      </div>
    );

    if (toolTab === "etc") return (
      <div className="settings-row">
        <label className="font-label">
          <button className="btn-toggle" onClick={() => setLinebreak((l) => l === "auto" ? "manual" : "auto")}>
            {linebreak === "auto" ? "행연결" : "행갈이"}
          </button>
        </label>
        <label className="font-label">
          바탕색
          <input type="text" value={pageColor} onChange={(e) => setPageColor(e.target.value)} className="color-input" />
        </label>
      </div>
    );

    const c = fontConfigs[toolTab];
    return (
      <div className="settings-row">
        <label className="font-label">
          {c.label}
          <select value={c.font} onChange={(e) => c.setFont(e.target.value)} className="font-select">
            <option value="">Noto Sans</option>
            {c.fonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="number" value={c.size} onChange={(e) => c.setSize(e.target.value)} className="size-input" step="0.1" min="0.1" />
          <select value={c.unit} onChange={(e) => c.setUnit(e.target.value)} className="font-select">
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input type="text" value={c.color} onChange={(e) => c.setColor(e.target.value)} className="color-input" />
        </label>
      </div>
    );
  }

  return (
    <div id="app">
      <iframe ref={printFrameRef} style={{ display: "none" }} title="print-frame" />

      <header className="header">
        <div className="tab-group">
          {(["editor", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`tab-btn${tab === t ? " active" : ""}`}>
              {t === "editor" ? "에디터" : "미리보기"}
            </button>
          ))}
        </div>
        <div className="tab-group">
          {TOOL_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleToolTab(key)}
              className={`toolbar-tab${toolTab === key ? " active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="header-right">
          <button className="btn-secondary" onClick={cycleSize}>{size.toUpperCase()}</button>
          <button className="btn-primary" onClick={handlePrint}>PDF</button>
        </div>
      </header>

      {renderSettingsRow()}

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
