import sharp from "sharp"
import pngToIco from "png-to-ico"
import { writeFileSync, copyFileSync } from "fs"

const PUB = "public"
const BRAND = "public/brand"

async function run() {
  // MP360 — PWA/manifest icons + apple touch icon, from the ink-background icon
  await sharp(`${BRAND}/mp360-icon-dark.png`).resize(192, 192).toFile(`${PUB}/mp360-icon-192.png`)
  await sharp(`${BRAND}/mp360-icon-dark.png`).resize(512, 512).toFile(`${PUB}/mp360-icon-512.png`)
  await sharp(`${BRAND}/mp360-icon-dark.png`).resize(180, 180).toFile(`${PUB}/mp360-icon-180.png`)

  // favicon.ico — classic multi-resolution container
  const sizes = [16, 32, 48]
  const pngBuffers = await Promise.all(
    sizes.map((s) => sharp(`${BRAND}/mp360-icon-dark.png`).resize(s, s).png().toBuffer())
  )
  const ico = await pngToIco(pngBuffers)
  writeFileSync(`${PUB}/../src/app/favicon.ico`, ico)

  // Me360 — its own icon set (same design today, kept as separate files so
  // MP360 and Me360 can diverge independently later)
  const ME360_SRC = "brand/Me360-logo-files"
  copyFileSync(`${BRAND}/me360-icon-preview.svg`, `${PUB}/me360-icon.svg`)
  await sharp(`${ME360_SRC}/me360-icon-preview.png`).resize(180, 180).toFile(`${PUB}/me360-icon-180.png`)
  await sharp(`${ME360_SRC}/me360-icon-preview.png`).resize(192, 192).toFile(`${PUB}/me360-icon-192.png`)
  await sharp(`${ME360_SRC}/me360-icon-preview.png`).resize(512, 512).toFile(`${PUB}/me360-icon-512.png`)

  console.log("done")
}

run().catch((e) => { console.error(e); process.exit(1) })
