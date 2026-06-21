export const CLASSES = [
  { id: 'peasant', name: 'Peasant', health: 15, description: 'Play as Peasant for no bonuses' },
  { id: 'seer',    name: 'Seer', health: 10, description: 'Play as Seer to reveal a letter in each word' },
  { id: 'knight',  name: 'Knight', health: 20, description: 'Play as Knight for extra chances after failure' },
  { id: 'scholar', name: 'Scholar', health: 12, description: 'Reveals information about the word' },
]

export const ENEMIES = [
  { id: 'useless-goblin', name: 'Useless Goblin', regen: 1, health: 1, effect: 'No effect',                            difficulty: 1 },
  { id: 'cave-spider',    name: 'Cave Spider',     regen: 1, health: 1, effect: 'No effect',                            difficulty: 1 },
  { id: 'annoying-kid',   name: 'Annoying Kid',    regen: 1, health: 3, effect: 'He will make your first guess for you', difficulty: 2 },
]

export const BOSSES = [
  {
    id:           'shadow-sorcerer',
    name:         'Shadow Sorcerer',
    health:       3,
    regen:        0,
    effect:       'The centermost column is obscured',
    announcement: 'Your quest is to defeat the Shadow Sorcerer, who has cast a shadow over the center letter of your words.',
  },
  {
    id:           'gelatinous-cube',
    name:         'Gelatinous Cube',
    health:       3,
    regen:        0,
    effect:       'A chosen letter deals double damage each round',
    announcement: 'Your quest is to defeat the Gelatinous Cube. Each round it marks a letter — any guess containing that letter deals 2 damage instead of 1.',
  },
]
