import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const pump = promisify(pipeline);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dir = searchParams.get("dir");

    if (!dir) {
      return NextResponse.json({ error: "Missing dir parameter" }, { status: 400 });
    }

    // Ensure we only serve from /public/cloned-sites
    const absPath = path.resolve(process.cwd(), "public", "cloned-sites", path.basename(dir));

    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const zipName = `${path.basename(absPath)}.zip`;
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Prepare response headers
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set("Content-Disposition", `attachment; filename=${zipName}`);

    // Stream the archive directly to the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    archive.on("data", (chunk) => writer.write(chunk));
    archive.on("end", () => writer.close());
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      writer.abort(err);
    });

    archive.directory(absPath, false);
    archive.finalize();

    return new NextResponse(stream.readable, { headers });
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
