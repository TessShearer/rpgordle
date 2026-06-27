export const CLASSES = [
  { id: 'peasant',       name: 'Peasant',       health: 10, description: 'No bonuses. A humble beginning.' },
  { id: 'seer',          name: 'Seer',           health:  5, description: 'Reveals a letter from each word.' },
  { id: 'knight',        name: 'Knight',         health: 15, description: 'Extra chances to survive failure.' },
  { id: 'scholar',       name: 'Scholar',        health:  7, description: 'Reveals the part of speech.' },
  { id: 'merchant',      name: 'Merchant',       health:  7, description: 'Open a shop before your quest.' },
  { id: 'assassin',      name: 'Assassin',       health:  9, description: 'Earn a Sneak Attack when 4+ letters are yellow.' },
  { id: 'cleric',        name: 'Cleric',         health:  8, description: 'Heal to full after every fight.' },
  { id: 'village-idiot', name: 'Village Idiot',  health: 10, description: 'Any string of letters is a valid guess.' },
  { id: 'thief',         name: 'The Thief',      health:  9, description: 'Take 2 items from the shop instead of 1.' },
]

export const ENEMIES = [
  { id: 'useless-goblin', name: 'Goblin',     regen: 1, health: 1, effect: 'No effect' },
  { id: 'cave-spider',    name: 'Cave Spider', regen: 1, health: 1, effect: 'No effect' },
]

export const MINIBOSSES = [
  { id: 'annoying-kid', name: 'Annoying Kid', regen: 1, health: 1, effect: 'He will make your first guess for you' },
]

export const SHOP_ITEMS = [
  {
    id:          'health-potion',
    name:        'Health Potion',
    description: 'Restores 1 HP when used.',
    effect:      'heal',
    cost:        2,
  },
  {
    id:          'shield',
    name:        'Shield',
    description: 'Blocks the boss ability for one guess.',
    effect:      'shield',
    cost:        4,
  },
  {
    id:          'crystal-ball',
    name:        'Crystal Ball',
    description: 'Reveals 2 letters in the current word.',
    effect:      'crystal-ball',
    cost:        3,
  },
  {
    id:          'crossbow',
    name:        'Crossbow',
    description: 'Reveals and autofills the first letter of the word.',
    effect:      'crossbow',
    cost:        2,
  },
]

export const SPECIAL_ITEMS = [
  {
    id:          'sneak-attack',
    name:        'Sneak Attack',
    description: 'Auto-solves this word for free. Use it or lose it.',
    effect:      'sneak-attack',
  },
]

export const ALL_ITEMS = [...SHOP_ITEMS, ...SPECIAL_ITEMS]

export const STAGE_SEQUENCE = ['enemy', 'miniboss', 'enemy']
export const JOURNEY_LENGTH = STAGE_SEQUENCE.length + 1

export const BOSSES = [
  {
    id:                   'shadow-sorcerer',
    name:                 'Shadow Sorcerer',
    health:               3,
    regen:                0,
    effect:               'The centermost column is obscured',
    announcement:         'Your quest is to defeat the Shadow Sorcerer, who has cast a shadow over the center letter of your words.',
    enhancedAnnouncement: 'You face the Shadow Sorcerer directly! Now TWO columns are shrouded from your sight.',
  },
  {
    id:                   'gelatinous-cube',
    name:                 'Gelatinous Cube',
    health:               3,
    regen:                0,
    effect:               'A chosen letter deals double damage each round',
    announcement:         'Your quest is to defeat the Gelatinous Cube. Each round it marks a letter — any guess containing that letter deals 2 damage instead of 1.',
    enhancedAnnouncement: 'You face the Gelatinous Cube directly! Now THREE letters are marked for double damage each round.',
  },
]
