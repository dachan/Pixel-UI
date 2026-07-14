/**
 * Records a UI-only Pixel UI highlight from the live local app.
 * Output: marketing/video/pixel-ui-highlight.webm (+ stills in captures/)
 *
 * Usage: node marketing/video/record-highlight.mjs
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const CAPTURES = path.join(OUT_DIR, "captures");
const URL = process.env.PIXEL_UI_URL || "http://127.0.0.1:4000/";
// Native Pi touchscreen resolution — viewport AND record size must match.
// A larger recordVideo size leaves the UI stranded in the corner of the frame.
const W = 800;
const H = 480;

fs.mkdirSync(CAPTURES, { recursive: true });

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function still(page, name) {
  await page.screenshot({
    path: path.join(CAPTURES, `${name}.png`),
    type: "png",
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: path.join(OUT_DIR, "raw"),
      size: { width: W, height: H },
    },
  });

  const page = await context.newPage();

  // Hide on-screen Capture (GPIO-style layout) before first paint.
  await page.addInitScript(() => {
    localStorage.setItem("showCaptureButton", "false");
  });

  // MJPEG preview never goes network-idle — wait for load + the preview img.
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('img[alt="Live camera preview"]', { timeout: 20000 });
  // Ensure the preference took (hook reads localStorage post-mount).
  await page.evaluate(() => localStorage.setItem("showCaptureButton", "false"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('img[alt="Live camera preview"]', { timeout: 20000 });

  // Strip the Next.js Dev Tools "N" badge (lives in <nextjs-portal> shadow DOM —
  // stylesheet rules alone don't reach it).
  async function stripDevBadge() {
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal, next-route-announcer").forEach((el) => {
        el.remove();
      });
      document
        .querySelectorAll('[data-nextjs-dev-overlay], [data-nextjs-toast]')
        .forEach((el) => el.remove());
    });
  }
  await stripDevBadge();
  // Let MJPEG paint a few frames of the photo scene.
  await sleep(1500);
  await stripDevBadge();

  // --- 1. Hero: Camera / Exposure ---
  await still(page, "01-camera-exposure");
  await sleep(2200);

  // --- 2. Tap-to-focus on viewfinder ---
  const preview = page.locator('img[alt="Live camera preview"]');
  const box = await preview.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.48);
    await sleep(350);
    await still(page, "02-tap-focus");
    await sleep(900);
  }

  // --- 3. Focus + Manual → peaking ---
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await sleep(400);
  await page.getByRole("button", { name: "Manual", exact: true }).click();
  await sleep(800);
  await still(page, "03-focus-peaking");
  await sleep(2200);

  // Nudge lens slider if present (shows peaking responding).
  const lens = page.locator('input[type="range"]').first();
  if (await lens.count()) {
    await lens.evaluate((el) => {
      el.value = String(Math.min(Number(el.max) || 10, 6));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await sleep(1000);
  }

  // --- 4. WB ---
  await page.getByRole("button", { name: "WB", exact: true }).click();
  await sleep(900);
  await still(page, "04-wb");
  await sleep(1400);

  // --- 5. Capture flash (API — on-screen button is hidden) ---
  await page.getByRole("button", { name: "Exposure", exact: true }).click();
  await sleep(300);
  await page.request.post("http://127.0.0.1:5001/api/capture");
  await sleep(200);
  await still(page, "05-capture-flash");
  await sleep(1400);

  // --- 6. Gallery ---
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await sleep(1200);
  await still(page, "06-gallery");
  await sleep(1800);

  // --- 7. Meta ---
  await page.getByRole("button", { name: "Meta", exact: true }).click();
  await sleep(1000);
  await still(page, "07-meta");
  await sleep(1600);

  // --- 8. Settings ---
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await sleep(1000);
  await still(page, "08-settings");
  await sleep(1800);

  // --- 9. Back to camera hero close ---
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await sleep(500);
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Manual", exact: true }).click();
  await sleep(1200);
  await still(page, "09-closing");
  await sleep(2000);

  await context.close();
  await browser.close();

  // Playwright writes a random webm name under raw/
  const rawDir = path.join(OUT_DIR, "raw");
  const webms = fs.readdirSync(rawDir).filter((f) => f.endsWith(".webm"));
  if (!webms.length) throw new Error("No Playwright webm recorded");
  const src = path.join(rawDir, webms[0]);
  const destWebm = path.join(OUT_DIR, "pixel-ui-highlight-raw.webm");
  fs.renameSync(src, destWebm);
  console.log("Recorded:", destWebm);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
