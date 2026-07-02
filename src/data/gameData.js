export const CLASSES = [
  { id: 'peasant', name: 'Peasant', health: 10, description: 'A peasant with no abilities.' },
  { id: 'seer', name: 'Seer', health: 5, description: 'Reveals a letter from each word.' },
  { id: 'knight', name: 'Knight', health: 15, description: 'Knights have extra health' },
  { id: 'scholar', name: 'Scholar', health: 7, description: 'Can tell you information about the word.' },
  { id: 'treasurer', name: 'Treasurer', health: 7, description: 'Start the game with 2 inventory items' },
  { id: 'assassin', name: 'Assassin', health: 9, description: 'Can sneak attack with enough yellow letters.' },
  { id: 'cleric', name: 'Cleric', health: 8, description: 'Heal to full after every fight.' },
  { id: 'village-idiot', name: 'Village Idiot', health: 10, description: 'Any string of letters is a valid guess, not just real words.' },
  { id: 'thief', name: 'The Thief', health: 9, description: 'Take 2 items from the shop instead of 1.' },
  { id: 'changeling', name: 'The Changeling', health: 11, description: 'Gain the ability of a random character, and gain another later on.' },
]

export const ENEMIES = [
  { id: 'useless-goblin', name: 'Goblin', regen: 1, health: 1, effect: '' },
  { id: 'cave-spider', name: 'Cave Spider', regen: 1, health: 1, effect: '' },
  { id: 'imp', name: 'Imp', regen: 1, health: 1, effect: '' },
  { id: 'zombie', name: 'Zombie', regen: 1, health: 1, effect: '' },
  { id: 'orc', name: 'Orc', regen: 1, health: 1, effect: '' },
  { id: 'skeleton', name: 'Skeleton', regen: 1, health: 1, effect: '' },
  { id: 'dire-wolf', name: 'Dire Wolf', regen: 1, health: 1, effect: '' },
  { id: 'bandit', name: 'Bandit', regen: 1, health: 1, effect: '' },

]

export const MINIBOSSES = [
  { id: 'annoying-kid', name: 'Annoying Kid', regen: 1, health: 1, effect: 'He will make your first guess for you' },
]

export const SHOP_ITEMS = [
  {
    id: 'health-potion',
    name: 'Health Potion',
    description: 'Restores 1 HP when used.',
    effect: 'heal',
    cost: 2,
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Blocks the boss ability for one guess.',
    effect: 'shield',
    cost: 4,
  },
  {
    id: 'crystal-ball',
    name: 'Crystal Ball',
    description: 'Reveals 2 letters in the current word.',
    effect: 'crystal-ball',
    cost: 3,
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    description: 'Reveals and autofills the first letter of the word.',
    effect: 'crossbow',
    cost: 2,
  },
  {
    id: 'vorpalSword',
    name: 'Vorpal Sword',
    description: 'When used, your next hit deals an extra damage.',
    effect: 'vorpal-sword',
    cost: 2,
  },
]

export const SPECIAL_ITEMS = [
  {
    id: 'sneak-attack',
    name: 'Sneak Attack',
    description: 'Auto-solves this word for free. Use it or lose it.',
    effect: 'sneak-attack',
  },
]

export const ALL_ITEMS = [...SHOP_ITEMS, ...SPECIAL_ITEMS]

export const STAGE_SEQUENCE = ['enemy', 'miniboss', 'enemy']
export const JOURNEY_LENGTH = STAGE_SEQUENCE.length + 1

export const BOSSES = [
  {
    id: 'shadow-sorcerer',
    name: 'Shadow Sorcerer',
    health: 3,
    regen: 0,
    wordLength: 5,
    effect: 'The centermost column is obscured',
    announcement: 'Your quest is to defeat the Shadow Sorcerer, who has cast a shadow over the center letter of your words.',
    enhancedAnnouncement: 'You found the boss! Now TWO columns are shrouded from your sight.',
  },
  {
    id: 'gelatinous-cube',
    name: 'Gelatinous Cube',
    health: 3,
    regen: 0,
    wordLength: 5,
    effect: 'A chosen letter deals double damage each round',
    announcement: 'Your quest is to defeat the Gelatinous Cube. Each round it marks a letter — any guess containing that letter deals 2 damage instead of 1.',
    enhancedAnnouncement: 'You found the boss! Now THREE letters are marked for double damage each round.',
  },
  {
    id: 'abominable-snowman',
    name: 'Abominable Snowman',
    health: 3,
    regen: 0,
    wordLength: 5,
    effect: 'Freezes correct guesses in place',
    announcement: 'Your quest is to defeat the Aboninable Snowman. It will freeze a correctly guessed letter in place for all future guesses.',
    enhancedAnnouncement: 'You found the boss! Now yellow letters must be used!',
  },
    {
    id: 'necromancer',
    name: 'Necromancer',
    health: 3,
    regen: 0,
    wordLength: 5,
    effect: 'Take extra damage for repeated used words',
    announcement: 'Your quest is to defeat the Necromancer. Using the same word twice will deal an extra damage',
    enhancedAnnouncement: 'You found the boss! Using greyed out letters will now deal extra damage as well!',
  },
  {
    id: 'hydra',
    name: 'Hydra',
    health: 1,
    regen: 0,
    wordLength: 5,
    boardCount: 4,
    effect: 'Right now there is only the boss but i will add miniboss ok',
    announcement: 'The Hydra blocks your path! You must defeat all four heads at the same time.',
    enhancedAnnouncement: 'You found the Hydra!',
  },
]
