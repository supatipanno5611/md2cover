import { readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export function GET() {
  try {
    const files = readdirSync(join(process.cwd(), "public/templates"))
      .filter((f) => f.endsWith(".css"));
    return NextResponse.json(files);
  } catch {
    return NextResponse.json([]);
  }
}
