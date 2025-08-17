import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { html } = await req.json();

  if (!id || !html) {
    return NextResponse.json({ error: "Missing id or html" }, { status: 400 });
  }

  const filePath = path.resolve(`./public/cloned-sites/${id}/index.html`);
  fs.writeFileSync(filePath, html, "utf-8");

  return NextResponse.json({ success: true });
}
