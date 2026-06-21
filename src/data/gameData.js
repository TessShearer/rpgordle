export const CLASSES = [
  { id: 'peasant', name: 'Peasant', health: 10, description: 'Play as Peasant for no bonuses' },
  { id: 'seer',    name: 'Seer',    health:  5, description: 'Play as Seer to reveal a letter in each word' },
  { id: 'knight',  name: 'Knight',  health: 15, description: 'Play as Knight for extra chances after failure' },
  { id: 'scholar', name: 'Scholar', health:  7, description: 'Reveals information about the word' },
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
    description: 'Blocks the boss ability for one guess. Reveals the obscured column for the Shadow Sorcerer; prevents double damage for the Gelatinous Cube.',
    effect:      'shield',
    cost:        4,
  },
  {
    id:          'crystal-ball',
    name:        'Crystal Ball',
    description: 'Reveals a letter in the current word. Seers receive an additional letter they have not yet seen.',
    effect:      'crystal-ball',
    cost:        3,
  },
]

export const BOSSES = [
  {
    id:                   'shadow-sorcerer',
    name:                 'Shadow Sorcerer',
    health:               3,
    regen:                0,
    effect:               'The centermost column is obscured',
    announcement:         'Your quest is to defeat the Shadow Sorcerer, who has cast a shadow over the center letter of your words.',
    enhancedAnnouncement: 'You face the Shadow Sorcerer directly! The darkness deepens — now TWO columns are shrouded from your sight.',
  },
  {
    id:                   'gelatinous-cube',
    name:                 'Gelatinous Cube',
    health:               3,
    regen:                0,
    effect:               'A chosen letter deals double damage each round',
    announcement:         'Your quest is to defeat the Gelatinous Cube. Each round it marks a letter — any guess containing that letter deals 2 damage instead of 1.',
    enhancedAnnouncement: 'You face the Gelatinous Cube directly! It seethes with power — now THREE letters are marked for double damage each round.',
  },
]
