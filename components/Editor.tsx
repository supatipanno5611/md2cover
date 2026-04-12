"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";

function brCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/<\w*/);
  if (!word) return null;
  return {
    from: word.from,
    options: [{ label: "<br>", type: "keyword", boost: 99, detail: "줄바꿈" }],
  };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "14px", background: "#faf7f2" },
  ".cm-scroller": { overflow: "auto", fontFamily: "'Menlo', 'Monaco', monospace" },
  ".cm-content": { padding: "20px 24px", caretColor: "#1a1a1a" },
  ".cm-gutters": { background: "#f2ede6", border: "none", color: "#bbb" },
  ".cm-activeLineGutter": { background: "#ebe5dc" },
  ".cm-activeLine": { background: "#f0ebe3" },
  ".cm-cursor": { borderLeftColor: "#1a1a1a" },
  ".cm-selectionBackground": { background: "#ddd6c8 !important" },
  ".cm-tooltip.cm-tooltip-autocomplete": { minWidth: "160px" },
});

export default function Editor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          editorTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
          }),
          autocompletion({ override: [brCompletion] }),
        ],
      }),
      parent: ref.current,
    });
    viewRef.current = view;
    view.focus();
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return <div ref={ref} style={{ height: "100%" }} />;
}
