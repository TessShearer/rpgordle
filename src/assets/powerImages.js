import shadowSorcererPower from '@/assets/shadow-sorcerer-power.png'
import gelatinousCubePower from '@/assets/gelatinous-cube-power.png'
import necromancerPower from '@/assets/necromancer-power.png'
import abominableSnowmanPower from '@/assets/abominable-snowman-power.png'

// Keyed by boss id, following the `<boss-id>-power.png` naming convention.
// Add a new import + entry here whenever a new boss's power illustration is added.
export const POWER_IMAGES = {
  'shadow-sorcerer': shadowSorcererPower,
  'gelatinous-cube': gelatinousCubePower,
  necromancer: necromancerPower,
  'abominable-snowman': abominableSnowmanPower,
}
