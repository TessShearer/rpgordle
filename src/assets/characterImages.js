import peasant from '@/assets/peasant.png'
import gelatinousCube from '@/assets/gelatinous-cube.png'
import giantSlime from '@/assets/giant-slime.png'
import { ENEMIES } from '@/data/gameData.js'

// Enemies get their art auto-resolved from this folder —
// a .gif for the id if one exists, else a .png, else no entry (template falls back to
// the usual art-placeholder). Add the file and it just works, no code changes needed.
const enemyAssetFiles = import.meta.glob('./*.{gif,png}', { eager: true, import: 'default' })
const enemyImages = {}
for (const enemy of ENEMIES) {
  enemyImages[enemy.id] =
    enemyAssetFiles[`./${enemy.id}.gif`] ?? enemyAssetFiles[`./${enemy.id}.png`] ?? null
}

export const CHARACTER_IMAGES = {
  peasant,
  'gelatinous-cube': gelatinousCube,
  'giant-slime': giantSlime,
  ...Object.fromEntries(Object.entries(enemyImages).filter(([, src]) => src)),
}
