// lib/cloner.ts
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import prettier from "prettier";

export async function saveWebsite(url: string, outputDir: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  // If site has iframe (like hitesh.ai → hiteshchoudhary.com)
  const iframeSrc = await page
    .$eval("iframe", (el) => el?.src)
    .catch(() => null);
  if (iframeSrc) {
    url = iframeSrc;
    await page.goto(iframeSrc, { waitUntil: "networkidle" });
  }

  // ensure folders
  fs.mkdirSync(outputDir, { recursive: true });
  const assetsDir = path.join(outputDir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });

  function absoluteUrl(base: string, relative: string) {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }

  async function downloadFile(fileUrl: string, filePath: string) {
    try {
      const response = await page.request.fetch(fileUrl);
      const buffer = await response.body();
      fs.writeFileSync(filePath, buffer);
      return true;
    } catch {
      return false;
    }
  }

  // --- CSS
  const cssHandles = await page.$$("link[rel='stylesheet']");
  for (let i = 0; i < cssHandles.length; i++) {
    const href = await cssHandles[i].getAttribute("href");
    if (!href) continue;
    const absHref = absoluteUrl(url, href);
    const fileName = `style-${i}.css`;
    const filePath = path.join(assetsDir, fileName);
    if (await downloadFile(absHref, filePath)) {
      await cssHandles[i].evaluate((link, newHref) => {
        link.setAttribute("href", newHref);
      }, `assets/${fileName}`);
    }
  }

  // --- JS
  const jsHandles = await page.$$("script[src]");
  for (let i = 0; i < jsHandles.length; i++) {
    const src = await jsHandles[i].getAttribute("src");
    if (!src) continue;
    const absSrc = absoluteUrl(url, src);
    const fileName = `script-${i}.js`;
    const filePath = path.join(assetsDir, fileName);
    if (await downloadFile(absSrc, filePath)) {
      await jsHandles[i].evaluate((script, newSrc) => {
        script.setAttribute("src", newSrc);
      }, `assets/${fileName}`);
    }
  }

  // --- Images
  const imgHandles = await page.$$("img[src]");
  for (let i = 0; i < imgHandles.length; i++) {
    const src = await imgHandles[i].getAttribute("src");
    if (!src) continue;
    const absSrc = absoluteUrl(url, src);
    const ext = path.extname(new URL(absSrc).pathname) || ".png";
    const fileName = `image-${i}${ext}`;
    const filePath = path.join(assetsDir, fileName);
    if (await downloadFile(absSrc, filePath)) {
      await imgHandles[i].evaluate((img, newSrc) => {
        img.setAttribute("src", newSrc);
      }, `assets/${fileName}`);
    }
  }

  // --- Save HTML
  let html = await page.content();
  html = await prettier.format(html, { parser: "html" });
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf-8");

  await browser.close();
  return { success: true, outputDir };
}
