import { readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

function readFonts(subdir: string): string[] {
  try {
    return readdirSync(join(process.cwd(), "public/fonts", subdir))
      .filter((f) => /\.(ttf|otf|woff|woff2)$/i.test(f));
  } catch {
    return [];
  }
}

export function GET() {
  return NextResponse.json({
    title: readFonts("title"),
    bold: readFonts("bold"),
    regular: readFonts("regular"),
    background: readFonts("background"),
  });
}
