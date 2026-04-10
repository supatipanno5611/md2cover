"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { parse } from "@/lib/parser";
import { render } from "@/lib/renderer";

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

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [previewHtml, setPreviewHtml] = useState("");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <iframe ref={printFrameRef} className="hidden" title="print-frame" />

      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <span className="font-semibold tracking-tight text-sm">md2cover</span>
        <button
          onClick={handlePrint}
          className="text-xs bg-white text-gray-900 font-medium px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
        >
          PDF 내보내기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-800 shrink-0">
            마크다운
          </div>
          <div className="flex-1 overflow-hidden bg-gray-900">
            <Editor value={markdown} onChange={setMarkdown} />
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-gray-900">
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-800 shrink-0">
            미리보기
          </div>
          <div className="flex-1 flex items-start justify-center p-8 overflow-auto">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                style={{ border: "none", width: "360px", height: "512px" }}
                title="preview"
                className="shadow-2xl"
              />
            ) : (
              <div className="text-gray-600 text-sm mt-20">로딩 중…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
