// Renders the film at twice the pixel density and pipes every frame straight into a near lossless master.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
(async () => {
  const [file, W, H, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 });
  await p.goto("file://" + __dirname + "/" + file); await p.waitForTimeout(1000); await p.evaluate(() => document.fonts.ready);
  const END = await p.evaluate(() => window.END), N = Math.ceil(END * 60);
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", "60", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv420p", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < N; i++) {
    await p.evaluate((t) => render(t), i / 60);
    const buf = await p.screenshot({ type: "jpeg", quality: 97 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 600 === 0) console.log(file, i, "/", N);
  }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r)); await b.close(); console.log("done", out, N);
})();
