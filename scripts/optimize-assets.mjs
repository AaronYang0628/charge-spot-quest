import { execFileSync } from 'node:child_process'
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
const manifest = JSON.parse(readFileSync('public/models/manifest.json', 'utf8'))
for (const name of Object.keys(manifest)) {
  const source = `public/models/${name}.glb`, output = `public/models/${name}.optimized.glb`
  execFileSync(process.execPath, ['node_modules/@gltf-transform/cli/bin/cli.js', 'optimize', source, output,
    '--compress', 'meshopt', '--flatten', 'false', '--join', 'false', '--instance', 'false',
    '--palette', 'false', '--simplify', 'false', '--texture-compress', 'false'], { stdio: 'inherit' })
  renameSync(output, source)
  manifest[name].optimizedBytes = readFileSync(source).length
}
writeFileSync('public/models/manifest.json', JSON.stringify(manifest, null, 2))
