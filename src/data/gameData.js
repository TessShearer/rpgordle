export const CLASSES = [
  { id: 'peasant', name: 'Peasant', health: 15, description: 'Play as Peasant for no bonuses' },
  { id: 'seer',    name: 'Seer', health: 10, description: 'Play as Seer to reveal a letter in each word' },
  { id: 'knight',  name: 'Knight', health: 20, description: 'Play as Knight for extra chances after failure' },
  { id: 'scholar', name: 'Scholar', health: 12, description: 'Reveals information about the word' },
]

export const ENEMIES = [
  { id: 'useless-goblin', name: 'Useless Goblin', regen: 1, health: 1, effect: 'No effect', difficulty: 1 },
  { id: 'annoying-kid', name: 'Annoying Kid', regen: 1, health: 3, effect: 'He will make your first guess for you', difficulty: 2 },
  { id: 'shadow-sorcerer', name: 'Shadow Sorcerer', regen: 1, health: 3, effect: 'The centermost column is obscured', difficulty: 2 },
  { id: 'cave-spider', name: 'Cave Spider', regen: 1, health: 1, effect: 'No effect', difficulty: 1 },
  { id: 'gelatinous-cube', name: 'Gelatinous Cube', regen: 1, health: 1, effect: 'No effect', difficulty: 1 },
  { id: 'boss', name: 'Boss', regen: 1, health: 5, effect: 'You will guess a long word', difficulty: 3 },
]
