import { readdir, access } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { thumbPath } from '../src/lib/thumb'

const uploadsDir = join(process.cwd(), 'public', 'uploads')

async function run() {
  const files = await readdir(uploadsDir)
  const originals = files.filter(
    f => !f.endsWith('-thumb.jpg') && /\.(jpe?g|png|webp|gif)$/i.test(f)
  )

  console.log(`Found ${originals.length} original images`)
  let generated = 0
  let skipped = 0
  let errors = 0

  for (const file of originals) {
    const thumbName = thumbPath(file)
    const thumbFilepath = join(uploadsDir, thumbName)

    try {
      await access(thumbFilepath)
      skipped++
      continue
    } catch {
      // thumb doesn't exist, generate it
    }

    try {
      await sharp(join(uploadsDir, file))
        .resize(600)
        .jpeg({ quality: 80 })
        .toFile(thumbFilepath)
      console.log(`✓ ${file} → ${thumbName}`)
      generated++
    } catch (err) {
      console.error(`✗ ${file}: ${err}`)
      errors++
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors`)
}

run().catch(console.error)
