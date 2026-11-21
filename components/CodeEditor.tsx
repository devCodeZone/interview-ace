"use client";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";

export default function CodeEditor({ value, onChange, height = "340px" }: { value: string; onChange: (v: string) => void; height?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line text-[13px]">
      <CodeMirror value={value} height={height} theme={tokyoNight} extensions={[javascript({ jsx: true, typescript: true })]} onChange={onChange} basicSetup={{ tabSize: 2 }} />
    </div>
  );
}
