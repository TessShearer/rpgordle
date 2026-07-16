export const CLASSES = [
  { id: 'peasant', name: 'Peasant', health: 14, description: 'Peasants have no ability' },
  { id: 'seer', name: 'Seer', health: 10, description: 'Seers reveal a yellow letter from each word' },
  { id: 'knight', name: 'Knight', health: 15, description: 'Knights have extra health and a shield' },
  { id: 'scholar', name: 'Scholar', health: 13, description: 'Scholars can tell you information about the type of word' },
  { id: 'treasurer', name: 'Treasurer', health: 10, description: 'Treasurers start the game with 2 items' },
  { id: 'assassin', name: 'Assassin', health: 8, description: 'Assassins can sneak attack with 3/5 yellow letters' },
  { id: 'cleric', name: 'Cleric', health: 6, description: 'Clerics heal to full health after every correct guess' },
  { id: 'village-idiot', name: 'Village Idiot', health: 13, description: 'For the Village Idiot, any string of letters is a valid word' },
  { id: 'thief', name: 'Thief', health: 12, description: 'Thieves take 2 items from the shop instead of 1' },
  { id: 'fortune-teller', name: 'Fortune Teller', health: 12, description: 'Fortune Tellers reveal some letters that are not in the word' },
  { id: 'archer', name: 'Archer', health: 13, description: 'Archers shoot the gameboard to reveal a green letter' },
  { id: 'changeling', name: 'Changeling', health: 10, description: 'Gain the ability of a random character, and gain another later on' },
]

export const ENEMIES = [
  { id: 'useless-goblin', name: 'Goblin', regen: 2, health: 1, effect: '' },
  { id: 'cave-spider', name: 'Cave Spider', regen: 2, health: 1, effect: '' },
  { id: 'imp', name: 'Imp', regen: 2, health: 1, effect: '' },
  { id: 'zombie', name: 'Zombie', regen: 2, health: 1, effect: '' },
  { id: 'orc', name: 'Orc', regen: 2, health: 1, effect: '' },
  { id: 'skeleton', name: 'Skeleton', regen: 2, health: 1, effect: '' },
  { id: 'dire-wolf', name: 'Dire Wolf', regen: 2, health: 1, effect: '' },
  { id: 'bandit', name: 'Bandit', regen: 2, health: 1, effect: '' },

]

export const MINIBOSSES = [
  { id: 'annoying-kid', name: 'Annoying Kid', regen: 3, health: 1, effect: 'He will make your first guess for you' },
  { id: 'tricksy-fairy', name: 'Tricksy Fairy', regen: 3, health: 1, effect: 'If your guess is not correct, she will scramble it before submitting.' },
  { id: 'cerberus', name: 'Cerberus', regen: 3, health: 1, boardCount: 3, wordLength: 5, effect: 'Should a dog have three heads?' },
  { id: 'mirror-spirit', name: 'Mirror Spirit', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'The answer (and all your guesses) must be the same forwards and backwards!' },
  { id: 'know-it-all', name: 'Know It All', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'The answer is a word he does not think you will know.' },
  { id: 'slumbering-giant', name: 'Slumbering Giant', regen: 4, health: 1, wordLength: 5, boardCount: 1, effect: 'You won\'t take any damage from a wrong guess...until you wake her up.' },
  { id: 'hydra-miniboss', name: 'Hydra', regen: 4, health: 1, wordLength: 5, boardCount: 1, effect: 'Cut off its head!' },
]

export const SHOP_ITEMS = [
  {
    id: 'health-potion',
    name: 'Health Potion',
    description: 'Restores 3 HP when used.',
    effect: 'heal',
    cost: 2,
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'When used, you take no damage from your next incorrect guess.',
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
    description: 'Use against the boss for your next hit to deal an extra damage.',
    effect: 'vorpal-sword',
    cost: 2,
  },
  {
    id: 'caltrops',
    name: 'Caltrops',
    description: 'Reveal 4 letters that aren\'t in the answer.',
    effect: 'caltrops',
    cost: 2,
  },
  {
    id: 'smoke-bomb',
    name: 'Smoke Bomb',
    description: 'Blocks the boss ability for one guess.',
    effect: 'smoke-bomb',
    cost: 2,
  },
  {
    id: 'vampiric-dagger',
    name: 'Vampiric Dagger',
    description: 'When used, you begin to heal +1 for each correct guess',
    effect: 'vampiric-dagger',
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
  {
    id: 'bow-and-arrow',
    name: 'Arrow',
    description: 'Reveal any one letter in the current word.',
    effect: 'bow-and-arrow',
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
    effect: 'A random letter on your first guess is hidden in shadow',
    effect: 'A random letter is hidden in shadow',
    announcement: 'Your quest is to defeat the Shadow Sorcerer, who veils a random letter on your first guess each round.',
    enhancedAnnouncement: 'You found the boss! He casts a shadow over part of every guess',
  },
  {
    id: 'gelatinous-cube',
    name: 'Gelatinous Cube',
    health: 2,
    regen: 0,
    wordLength: 5,
    boardCount: 1,
    effect: 'Guessing a slime covered letter will deal an extra damage',
    enhancedEffect: 'Multiple letters are slimed and guesses with any slime deal extra damage.',
    announcement: 'Your quest is to defeat the Gelatinous Cube. It will cover letters in toxic slime. Guesses with a slimed letter will deal 1 extra damage.',
    enhancedAnnouncement: 'You found the boss! Now THREE letters are slimed for double damage.',
  },
  {
    id: 'giant-slime',
    name: 'Giant Slime',
    health: 3,
    regen: 0,
    wordLength: 8,
    boardCount: 1,
    rounds: [
      { boardCount: 1, wordLength: 8 },
      { boardCount: 2, wordLength: 5 },
      { boardCount: 4, wordLength: 3 },
    ],
    effect: 'The slime can survive being split into pieces.',
    enhancedEffect: "Can survive being split into pieces",
    announcement: 'Your quest is to defeat the Giant Slime. It is hiding deep in the kingdom and can survive being split to pieces.',
    enhancedAnnouncement: 'You found the boss! Chop it to bits!',
  },
  {
    id: 'abominable-snowman',
    name: 'Abominable Snowman',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Freezes correct guesses in place',
    enhancedEffect: "Freezes green letters and requires you to use yellow letters",
    announcement: 'Your quest is to defeat the Aboninable Snowman. It will freeze a correctly guessed letter in place for all future guesses.',
    enhancedAnnouncement: 'You found the boss! Now yellow letters must be used!',
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Take extra damage for repeatedly used words across the game',
    enhancedEffect: 'Take extra damage for repeatedly used words AND for using greyed out letters',
    announcement: 'Your quest is to defeat the Necromancer. Using the same word twice will deal an extra damage',
    enhancedAnnouncement: 'You found the boss! Using greyed out letters will now deal extra damage as well!',
  },
    {
    id: 'plague-lord',
    name: 'Plague Lord',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Heal one less hp every time you heal, minimum 1',
    enhancedEffect: 'Take extra damage for repeatedly used words AND for using greyed out letters',
    announcement: 'Your quest is to defeat the Necromancer. Using the same word twice will deal an extra damage',
    enhancedAnnouncement: 'You found the boss! Using greyed out letters will now deal extra damage as well!',
  },
  {
    id: 'hydra',
    name: 'Hydra',
    health: 3,
    regen: 0,
    wordLength: 5,
    boardCount: 2,
    rounds: [
      { boardCount: 2, wordLength: 5 },
      { boardCount: 4, wordLength: 5 },
      { boardCount: 6, wordLength: 5 },
    ],
    effect: 'The Hydra grows more heads as you cut them off',
    announcement: 'Your quest is to defeat the Hydra by cutting off its head(s?)',
    enhancedAnnouncement: 'The Hydra grew more heads and returned! Give it another go.',
  },
]
