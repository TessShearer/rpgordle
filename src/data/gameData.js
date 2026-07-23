export const CLASSES = [
  { id: 'peasant', name: 'Peasant', health: 14, description: 'Peasants have no ability' },
  { id: 'seer', name: 'Seer', health: 10, description: 'Seers reveal a yellow letter from each word' },
  { id: 'knight', name: 'Knight', health: 15, description: 'Knights start with a shield' },
  { id: 'scholar', name: 'Scholar', health: 12, description: 'Scholars can tell you information about the word' },
  { id: 'treasurer', name: 'Treasurer', health: 10, description: 'Treasurers start the game with 2 items' },
  { id: 'assassin', name: 'Assassin', health: 8, description: 'Assassins can sneak attack with 3/5 yellow letters' },
  { id: 'cleric', name: 'Cleric', health: 6, description: 'Clerics heal to full health after every correct guess' },
  { id: 'village-idiot', name: 'Village Idiot', health: 13, description: 'For the Village Idiot, any string of letters is a valid word' },
  { id: 'thief', name: 'Thief', health: 12, description: 'Thieves take 2 items from the shop instead of 1' },
  { id: 'fortune-teller', name: 'Fortune Teller', health: 12, description: 'Fortune Tellers reveal some letters that are not in the word' },
  { id: 'archer', name: 'Archer', health: 13, description: 'Archers shoot the gameboard to reveal a green letter' },
  { id: 'medium', name: 'Medium', health: 12, description: 'Mediums can store letters from the last battle and reveal them in the current one' },
  { id: 'wizard', name: 'Wizard', health: 13, description: 'Wizards have a spell book of magical words' },
  { id: 'changeling', name: 'Changeling', health: 10, description: 'Gain take on the ability of a random character, and gain another later on' },
]

export const CHANGELING_POOL = ['seer', 'scholar', 'assassin', 'cleric', 'village-idiot', 'thief', 'knight', 'treasurer', 'archer']

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
  { id: 'annoying-kid', name: 'Leprechaun', regen: 3, health: 1, effect: 'He will make your first guess for you' },
  { id: 'tricksy-fairy', name: 'Tricksy Fairy', regen: 3, health: 1, effect: 'If your guess is not correct, she will scramble it before submitting.' },
  { id: 'cerberus', name: 'Cerberus', regen: 3, health: 1, boardCount: 3, wordLength: 5, effect: 'Should a dog have three heads?' },
  { id: 'mirror-spirit', name: 'Mirror Spirit', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'The answer (and all your guesses) must be the same forwards and backwards!' },
  { id: 'know-it-all', name: 'Sphinx', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'The answer is a word he does not think you will know.' },
  { id: 'slumbering-giant', name: 'Slumbering Giant', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'You won\'t take any damage from a wrong guess...until you wake her up.' },
  { id: 'wily-magician', name: 'Wily Magician', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'He places one piece of false information in every guess' },
  { id: 'little-elves', name: 'Little Elves', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'They steal the last letter from your guess...but always bring it back' },
  { id: 'mimic', name: 'Mimic', regen: 3, health: 1, wordLength: 5, boardCount: 1, effect: 'Using a letter two guesses in a row will do extra damage, unless you put it in the right place.' },
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
    description: 'Reveals 2 letters that are in the current word.',
    effect: 'crystal-ball',
    cost: 3,
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    description: 'Reveals the first letter of the word.',
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
    description: 'Automatically heals +1 for each correct guess',
    effect: 'vampiric-dagger',
    cost: 2,
  },
  {
    id: 'ancient-tome',
    name: 'Ancient Tome',
    description: 'Reveal the definition of the word.',
    effect: 'ancient-tome',
    cost: 2,
  },
  {
    id: 'dwarven-puzzle-box',
    name: 'Dwarven Puzzle Box',
    description: 'Gain two items after defeating the next enemy.',
    effect: 'dwarven-puzzle-box',
    cost: 2,
  },
  {
    id: 'recorder',
    name: 'Recorder',
    description: 'Automatically heals one health every 5 guesses',
    effect: 'recorder',
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
  {
    id: 'ouija-board',
    name: 'Ouija Board',
    description: 'Reveal all letters guessed in the previous fight on your keyboard now.',
    effect: 'ouija-board',
  },
  {
    id: 'spell-book',
    name: 'Spell Book',
    description: 'Say a spell\'s name as your guess to cast it.',
    effect: 'spell-book',
  },
]

export const ALL_ITEMS = [...SHOP_ITEMS, ...SPECIAL_ITEMS]

// Spells the Wizard can cast by guessing the spell's name instead of a word.
export const SPELLS = [
  { id: 'smoke', name: 'Smoke', description: 'Hide yourself from the boss for one turn' },
  { id: 'blast', name: 'Blast', description: 'Blast away 4 letters that aren\'t in the word' },
  { id: 'charm', name: 'Charm', description: 'Charm the enemy into giving you some information' },
  { id: 'wager', name: 'Wager', description: '90% chance to damage yourself, 10% chance to damage your enemy' },
]

export const STAGE_SEQUENCE = ['enemy', 'enemy', 'miniboss']
export const JOURNEY_LENGTH = STAGE_SEQUENCE.length + 1

// Giant Slime splits into more pieces, so its journey is shortened by one regular enemy
// to compensate for the extra boss rounds. Hydra has no miniboss at all — just two regular
// enemies before its 3-round boss fight (see the shop-timing note in GameView.vue's
// handleAllBoardsSolved, which opens the shop before the boss fight instead of a miniboss
// whenever a boss's sequence has no 'miniboss' stage).
const STAGE_SEQUENCE_OVERRIDES = {
  'giant-slime': ['enemy', 'miniboss'],
  'hydra': ['enemy', 'enemy'],
}

export function getStageSequence(bossId) {
  return STAGE_SEQUENCE_OVERRIDES[bossId] ?? STAGE_SEQUENCE
}

export function getJourneyLength(bossId) {
  return getStageSequence(bossId).length + 1
}

export const BOSSES = [
  {
    id: 'shadow-sorcerer',
    name: 'Shadow Sorcerer',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'A random letter on your first guess is hidden in shadow',
    enhancedEffect: 'A random letter is hidden in shadow',
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
    effect: 'Take an extra damage when guessing a word containing a slime-covered letter.',
    enhancedEffect: 'Multiple letters are slimed and guesses with any slime deal extra damage.',
    announcement: 'Your quest is to defeat the Gelatinous Cube. It will cover letters in acidic slime. Guesses with a slimed letter will deal 1 extra damage to you.',
    enhancedAnnouncement: 'You found the boss! Now 3 letters are slimed for extra damage.',
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
    effect: 'Freezes green letters in place.',
    enhancedEffect: "Freezes green letters and requires you to use yellow letters",
    announcement: 'Your quest is to defeat the Abominable Snowman. It will freeze correctly guessed letters in place for all future guesses.',
    enhancedAnnouncement: 'You found the boss! Now yellow letters must be used!',
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Guessing words adds them to the graveyard. Take extra damage for guessing words in the graveyard.',
    enhancedEffect: 'Take extra damage for using graveyard words AND for using greyed out letters.',
    announcement: 'Your quest is to defeat the Necromancer. Take extra damage from using the same word multiple times.',
    enhancedAnnouncement: 'You found the boss! Using greyed out letters will now deal extra damage as well!',
  },
  {
    id: 'plague-lord',
    name: 'Plague Lord',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Heal one less hp every time you heal, minimum 1',
    enhancedEffect: 'Your healing is still reduced',
    announcement: 'Your quest is to defeat the Plague Lord, who will reduce your healing by 1 every time you heal more than 1 health',
    enhancedAnnouncement: 'You found the boss!',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Guessing an on fire letter will deal an extra damage and douse the flame.',
    enhancedEffect: 'Be careful of the flames',
    announcement: 'Your quest is to defeat the Dragon, he will breathe fire that spreads onto your keyboard. Every burning letter in your guess will deal an extra damager"',
    enhancedAnnouncement: 'You found the boss! Be careful of the flames.',
  },
  {
    id: 'key-master',
    name: 'Key Master',
    health: 2,
    regen: 0,
    wordLength: 5,
    effect: 'Collect keys to unlock necessary letters',
    enhancedEffect: 'It\'s locked up tight',
    announcement: 'Your quest is to defeat the  Key Master, who has locked up necessary letters',
    enhancedAnnouncement: 'You found the boss! Unlock his locks.',
  },
  {
    id: 'hydra',
    name: 'Hydra',
    health: 3,
    regen: 0,
    wordLength: 5,
    boardCount: 1,
    rounds: [
      { boardCount: 1, wordLength: 5 },
      { boardCount: 2, wordLength: 5 },
      { boardCount: 4, wordLength: 5 },
    ],
    effect: 'The Hydra grows more heads as you cut them off',
    announcement: 'Your quest is to defeat the Hydra by cutting off its head(s?)',
    enhancedAnnouncement: 'The Hydra grew more heads and returned! Give it another go.',
  },
  {
    id: 'bug-guy',
    name: 'Dev Version of Beetle Guy',
    health: 2,
    regen: 0,
    testOnly: true,
    wordLength: 5,
    effect: 'Beetles on the board can heal or harm you',
    enhancedEffect: 'So...many...beetles',
    announcement: 'Your quest is to defeat mr. evil beetle man. Each health beetle heals you each poison beetle harms you."',
    enhancedAnnouncement: 'You found the boss! eheheheh...more beetles. Many more beetles.',
  },
]
