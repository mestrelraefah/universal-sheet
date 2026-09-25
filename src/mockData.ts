/**
 * ============================================================================
 * MOCK DATA: Vampire: The Masquerade (5th Edition)
 * ============================================================================
 * 
 * Ficha de exemplo demonstrando como o sistema Vampiro: A Máscara
 * é mapeado para o UniversalCharacterSheet.
 * 
 * Mapeamento:
 * - Attributes (Physical/Social/Mental) -> Gauges (category: 'stat')
 * - Skills -> Gauges (category: 'skill')
 * - Health/Willpower -> Gauges (category: 'resource')
 * - Humanity -> Gauge (category: 'safety_valve')
 * - Blood Potency -> Gauge (category: 'rank')
 * - Disciplines -> Gauges (category: 'skill')
 * - Dice Pool Resolution -> DieRollConfig (count_successes, d10)
 * - Touchstones/Convictions -> FuzzyGauge (type: 'aspects')
 * - Predator Type -> LookupTable (type: 'exact')
 * - Combat -> Contest (type: 'simple_opposed')
 * - Hunger triggers -> TriggerNode
 * ============================================================================
 */

import { UniversalCharacterSheet } from './types';

export const vampireMockSheet: UniversalCharacterSheet = {
  meta: {
    systemName: 'Vampire: The Masquerade',
    systemVersion: '5th Edition',
    characterName: 'Isabella "Bella" Voss',
    playerName: 'Player 1',
    sessionName: 'Nights of the Camarilla',
    createdAt: '2024-01-15T20:00:00.000Z',
    updatedAt: '2024-01-20T22:30:00.000Z',
    schemaVersion: '1.0.0',
    tags: ['vampire', 'camarilla', 'venture'],
    customFields: {
      clan: 'Ventrue',
      generation: '12th',
      concept: 'Disgraced Politician',
      ambition: 'Reclaim my former power',
      desire: 'Find redemption',
    },
  },

  // ========================================================================
  // GAUGES: Attributes, Skills, Resources
  // ========================================================================
  gauges: [
    // --- ATTRIBUTES (Physical) ---
    { id: 'attr-strength', name: 'Strength', category: 'stat', min: 1, max: 5, current: 2, step: 1, description: 'Physical power' },
    { id: 'attr-dexterity', name: 'Dexterity', category: 'stat', min: 1, max: 5, current: 3, step: 1, description: 'Agility and coordination' },
    { id: 'attr-stamina', name: 'Stamina', category: 'stat', min: 1, max: 5, current: 3, step: 1, description: 'Endurance and resilience' },
    
    // --- ATTRIBUTES (Social) ---
    { id: 'attr-charisma', name: 'Charisma', category: 'stat', min: 1, max: 5, current: 4, step: 1, description: 'Magnetic personality' },
    { id: 'attr-manipulation', name: 'Manipulation', category: 'stat', min: 1, max: 5, current: 4, step: 1, description: 'Subtle control' },
    { id: 'attr-composure', name: 'Composure', category: 'stat', min: 1, max: 5, current: 3, step: 1, description: 'Self-control' },
    
    // --- ATTRIBUTES (Mental) ---
    { id: 'attr-intelligence', name: 'Intelligence', category: 'stat', min: 1, max: 5, current: 3, step: 1, description: 'Mental acuity' },
    { id: 'attr-wits', name: 'Wits', category: 'stat', min: 1, max: 5, current: 2, step: 1, description: 'Quick thinking' },
    { id: 'attr-resolve', name: 'Resolve', category: 'stat', min: 1, max: 5, current: 4, step: 1, description: 'Mental fortitude' },

    // --- SKILLS ---
    { id: 'skill-politics', name: 'Politics', category: 'skill', min: 0, max: 5, current: 4, step: 1, description: 'Political maneuvering' },
    { id: 'skill-persuasion', name: 'Persuasion', category: 'skill', min: 0, max: 5, current: 3, step: 1, description: 'Convincing others' },
    { id: 'skill-insight', name: 'Insight', category: 'skill', min: 0, max: 5, current: 2, step: 1, description: 'Reading people' },
    { id: 'skill-leadership', name: 'Leadership', category: 'skill', min: 0, max: 5, current: 3, step: 1, description: 'Commanding others' },
    { id: 'skill-stealth', name: 'Stealth', category: 'skill', min: 0, max: 5, current: 1, step: 1, description: 'Moving unseen' },
    { id: 'skill-melee', name: 'Melee', category: 'skill', min: 0, max: 5, current: 1, step: 1, description: 'Close combat' },
    { id: 'skill-investigation', name: 'Investigation', category: 'skill', min: 0, max: 5, current: 2, step: 1, description: 'Finding clues' },
    { id: 'skill-academics', name: 'Academics', category: 'skill', min: 0, max: 5, current: 3, step: 1, description: 'Formal education' },

    // --- RESOURCES ---
    { id: 'health', name: 'Health', category: 'resource', min: 0, max: 6, current: 6, step: 1, description: 'Physical integrity (Stamina + 3)' },
    { id: 'willpower', name: 'Willpower', category: 'resource', min: 0, max: 5, current: 5, step: 1, description: 'Mental resilience (Composure + Resolve)' },
    { id: 'hunger', name: 'Hunger', category: 'resource', min: 1, max: 5, current: 2, step: 1, description: 'Beast\'s hunger (inverse resource - higher is worse!)' },

    // --- RANK ---
    { id: 'blood-potency', name: 'Blood Potency', category: 'rank', min: 0, max: 10, current: 1, step: 1, description: 'Power of Vitae' },

    // --- SAFETY VALVE ---
    { id: 'humanity', name: 'Humanity', category: 'safety_valve', min: 0, max: 10, current: 7, step: 1, description: 'Connection to mortal life' },

    // --- WOUND TRAITS ---
    { id: 'wound-penalty', name: 'Wound Penalty', category: 'wound', min: 0, max: 4, current: 0, step: 1, description: 'Dice penalty from injuries' },
  ],

  // ========================================================================
  // DIE ROLLS: Dice Pool configurations
  // ========================================================================
  dieRolls: [
    {
      id: 'roll-politics',
      name: 'Politics Check',
      dice: [{ type: 'd10', count: 7, label: 'Pool' }], // Charisma(4) + Politics(3) = 7 dice
      modifiers: [],
      successCondition: 'count_successes',
      successThreshold: 6, // V5: 6+ on d10 = success
      description: 'Roll Charisma + Politics dice pool',
    },
    {
      id: 'roll-persuasion',
      name: 'Persuasion Check',
      dice: [{ type: 'd10', count: 7, label: 'Pool' }], // Manipulation(4) + Persuasion(3)
      modifiers: [],
      successCondition: 'count_successes',
      successThreshold: 6,
      description: 'Roll Manipulation + Persuasion dice pool',
    },
    {
      id: 'roll-melee-attack',
      name: 'Melee Attack',
      dice: [{ type: 'd10', count: 3, label: 'Pool' }], // Dexterity(3) + Melee(1) = 3... actually let's say Str(2)+Melee(1)=3
      modifiers: [],
      successCondition: 'count_successes',
      successThreshold: 6,
      description: 'Roll Dexterity + Melee',
    },
    {
      id: 'roll-rout',
      name: 'Rouse Check',
      dice: [{ type: 'd10', count: 1, label: 'Rouse' }],
      modifiers: [],
      successCondition: 'target_number',
      targetNumber: 6,
      description: 'Single d10 - if fail, Hunger increases',
    },
    {
      id: 'roll-frenzy',
      name: 'Frenzy Check',
      dice: [{ type: 'd10', count: 2, label: 'Frenzy' }],
      modifiers: [{ source: 'Resolve', value: 4, type: 'flat' }],
      successCondition: 'count_successes',
      successThreshold: 6,
      description: 'Resolve + Composure to resist frenzy',
    },
  ],

  // ========================================================================
  // DECKS: Action Cards (Savage Worlds style - optional for V5)
  // ========================================================================
  decks: [
    {
      id: 'deck-action',
      name: 'Action Deck',
      type: 'poker',
      cards: generatePokerCards(),
      drawPile: [], // Would be shuffled
      discardPile: [],
      hand: [],
      shuffleOnEmpty: true,
      metadata: { system: 'Optional house rule' },
    },
  ],

  // ========================================================================
  // FUZZY GAUGES: Disciplines, Touchstones, Predator Type
  // ========================================================================
  fuzzyGauges: [
    {
      id: 'disciplines',
      name: 'Disciplines',
      type: 'feats',
      entries: [
        { id: 'disc-dominate-1', label: 'Dominate •', rank: 1, description: 'Cloud Memory, Command, Submerge Will' },
        { id: 'disc-dominate-2', label: 'Dominate ••', rank: 2, description: 'Mesmerize, Sleeping Mind' },
        { id: 'disc-presence-1', label: 'Presence •', rank: 1, description: 'Daunt, Dread Gaze' },
        { id: 'disc-auspex-1', label: 'Auspex •', rank: 1, description: 'Heightened Senses' },
      ],
      description: 'Ventrue clan disciplines',
    },
    {
      id: 'touchstones',
      name: 'Touchstones & Convictions',
      type: 'aspects',
      entries: [
        { id: 'ts-sister', label: 'Protect my sister from the truth', description: 'Conviction: Family above all' },
        { id: 'ts-legacy', label: 'Preserve my political legacy', description: 'Conviction: Power is responsibility' },
        { id: 'ts-redemption', label: 'Find a way to atone', description: 'Conviction: Redemption is possible' },
      ],
      description: 'Connections to mortal life that anchor Humanity',
    },
    {
      id: 'predator-type',
      name: 'Predator Type',
      type: 'ladder',
      entries: [
        { id: 'pt-allephant', label: 'Aleph', rank: 0, description: 'Blood bond through feeding' },
        { id: 'pt-blood-leech', label: 'Blood Leech', rank: 1, description: 'Steal from other Kindred' },
        { id: 'pt-catshouse', label: "Cat's House", rank: 2, description: 'Feed through seduction' },
        { id: 'pt-consort', label: 'Consort', rank: 3, description: 'Intimate feeding from lovers' },
        { id: 'pt-extortionist', label: 'Extortionist', rank: 4, description: 'Demand blood through threats' },
        { id: 'pt-financier', label: 'Financier', rank: 5, description: 'Buy blood from willing donors' },
        { id: 'pt-graverobber', label: 'Graverobber', rank: 6, description: 'Feed from the dead/dying' },
        { id: 'pt-monster', label: 'Monster', rank: 7, description: 'Violent, terrifying feeds' },
        { id: 'pt-osiris', label: 'Osiris', rank: 8, description: 'Cult followers offer blood' },
        { id: 'pt-pensioner', label: 'Pensioner', rank: 9, description: 'Long-term mortal donor arrangement' },
        { id: 'pt-sandman', label: 'Sandman', rank: 10, description: 'Feed from sleeping victims' },
        { id: 'pt-siren', label: 'Siren', rank: 11, description: 'Feed at clubs and social events' },
      ],
      currentValue: 'Financier',
      description: 'How Bella hunts for blood',
    },
    {
      id: 'conditions',
      name: 'Conditions',
      type: 'conditions',
      entries: [
        { id: 'cond-frightened', label: 'Frightened', description: 'Flee or face penalty' },
        { id: 'cond-impaired', label: 'Impaired', description: '-2 to all dice pools' },
        { id: 'cond-staked', label: 'Staked', description: 'Incapacitated' },
        { id: 'cond-torpo', label: 'Torpor', description: 'Unconscious, vulnerable' },
        { id: 'cond-frenzy', label: 'Frenzy', description: 'Beast in control' },
      ],
      activeConditions: [],
      description: 'Temporary conditions affecting the character',
    },
  ],

  // ========================================================================
  // LOOKUP TABLES: Predator bonuses, Generation effects
  // ========================================================================
  lookupTables: [
    {
      id: 'table-hunger-effects',
      name: 'Hunger Effects',
      type: 'range',
      entries: [
        { id: 'hunger-1', key: [1, 1] as [number, number], result: 'Sated - No penalties', effects: [{ type: 'narrative', description: 'The Beast is quiet' }] },
        { id: 'hunger-2', key: [2, 2] as [number, number], result: 'Hungry - Minor unease', effects: [{ type: 'narrative', description: 'Slight hunger pangs' }] },
        { id: 'hunger-3', key: [3, 3] as [number, number], result: 'Hungry 3 - Messy Critical risk', effects: [{ type: 'condition', target: 'messy-critical', description: 'Successes may be messy' }] },
        { id: 'hunger-4', key: [4, 4] as [number, number], result: 'Hungry 4 - Bestial failure risk', effects: [{ type: 'condition', target: 'bestial-failure', description: 'Failures may be bestial' }] },
        { id: 'hunger-5', key: [5, 5] as [number, number], result: 'STARVING - Frenzy risk!', effects: [{ type: 'trigger', target: 'roll-frenzy', description: 'Must check for frenzy' }] },
      ],
      description: 'Effects based on current Hunger level',
    },
    {
      id: 'table-humanity-stains',
      name: 'Humanity Stains',
      type: 'exact',
      entries: [
        { id: 'hs-theft', key: 'Theft', result: '-1 Humanity (minor theft)' },
        { id: 'hs-embrace', key: 'Embrace', result: '-2 Humanity (creating childer)' },
        { id: 'hs-murder', key: 'Murder', result: '-3 Humanity (killing a mortal)' },
        { id: 'hs-massacre', key: 'Massacre', result: '-4 Humanity (mass killing)' },
        { id: 'hs-diablerie', key: 'Diablerie', result: '-5 Humanity (soul theft)' },
        { id: 'hs-kindred-kill', key: 'Kindred Death', result: '-2 Humanity (killing another vampire)' },
      ],
      description: 'Actions that reduce Humanity',
    },
    {
      id: 'table-willpower',
      name: 'Willpower Rouse',
      type: 'range',
      entries: [
        { id: 'wp-1', key: [1, 3] as [number, number], result: 'Fail - Lose 1 Willpower', effects: [{ type: 'gauge_modify', target: 'willpower', value: -1 }] },
        { id: 'wp-2', key: [4, 5] as [number, number], result: 'Partial - No effect', effects: [] },
        { id: 'wp-3', key: [6, 7] as [number, number], result: 'Success - Add 2 dice', effects: [{ type: 'gauge_modify', target: 'dice_pool', value: 2 }] },
        { id: 'wp-4', key: [8, 9] as [number, number], result: 'Great - Add 3 dice', effects: [{ type: 'gauge_modify', target: 'dice_pool', value: 3 }] },
        { id: 'wp-5', key: [10, 10] as [number, number], result: 'Critical - Add 4 dice + effect', effects: [{ type: 'gauge_modify', target: 'dice_pool', value: 4 }] },
      ],
      description: 'Roll d10 when spending Willpower for a Rouse',
    },
  ],

  // ========================================================================
  // CONTESTS: Combat and social conflicts
  // ========================================================================
  contests: [
    {
      id: 'contest-melee',
      name: 'Melee Combat',
      type: 'simple_opposed',
      participants: [
        {
          id: 'attacker',
          name: 'Bella (Attack)',
          approach: { dieRollId: 'roll-melee-attack', description: 'Dexterity + Melee pool' },
          advantages: ['Weapon: Katana (+1 die)'],
          disadvantages: [],
        },
        {
          id: 'defender',
          name: 'Target (Dodge)',
          approach: { gaugeId: 'attr-dexterity', flatBonus: 2, description: 'Dexterity + Athletics' },
          advantages: [],
          disadvantages: [],
        },
      ],
      stakes: {
        winnerGets: 'Deal damage (successes = damage dice)',
        loserLoses: 'Take damage and lose initiative',
        tieResult: 'Clash - no damage, reset',
      },
      status: 'pending',
    },
    {
      id: 'contest-social',
      name: 'Social Persuasion',
      type: 'task_resolution',
      participants: [
        {
          id: 'bella-social',
          name: 'Bella',
          approach: { dieRollId: 'roll-persuasion', description: 'Manipulation + Persuasion' },
          advantages: ['Touchstone: Political Legacy'],
          disadvantages: ['Target is suspicious'],
        },
      ],
      stakes: {
        winnerGets: 'Target complies or reveals information',
        loserLoses: 'Target becomes hostile or suspicious',
      },
      status: 'pending',
      metadata: { targetNumber: 3 }, // Need 3 successes
    },
  ],

  // ========================================================================
  // TRIGGERS: Automated mechanics
  // ========================================================================
  triggers: [
    {
      id: 'trigger-hunger-frenzy',
      name: 'Hunger Frenzy Check',
      description: 'When Hunger reaches 5, must resist frenzy',
      condition: {
        type: 'gauge_threshold',
        targetId: 'hunger',
        operator: '>=',
        value: 5,
      },
      actions: [
        { type: 'roll_dice', targetId: 'roll-frenzy', description: 'Roll to resist frenzy' },
        { type: 'activate_condition', targetId: 'conditions', value: 'cond-frenzy', description: 'Mark Frenzy condition if failed' },
      ],
      enabled: true,
      priority: 1,
    },
    {
      id: 'trigger-health-zero',
      name: 'Incapacitated',
      description: 'When Health reaches 0, character is incapacitated',
      condition: {
        type: 'gauge_threshold',
        targetId: 'health',
        operator: '<=',
        value: 0,
      },
      actions: [
        { type: 'activate_condition', targetId: 'conditions', value: 'cond-torpo', description: 'Enter Torpor' },
        { type: 'narrative', targetId: 'narrative', value: 'Bella collapses, the Beast retreating as her body fails. She enters Torpor.', description: 'Narrative: Enter Torpor' },
      ],
      enabled: true,
      priority: 2,
    },
    {
      id: 'trigger-humanity-zero',
      name: 'Beast Takes Over',
      description: 'When Humanity reaches 0, the Beast wins',
      condition: {
        type: 'gauge_threshold',
        targetId: 'humanity',
        operator: '<=',
        value: 0,
      },
      actions: [
        { type: 'narrative', targetId: 'narrative', value: 'Humanity is lost. Bella becomes an NPC - a monster consumed by the Beast.', description: 'Character becomes NPC' },
      ],
      enabled: true,
      priority: 0,
    },
    {
      id: 'trigger-rouse-fail',
      name: 'Failed Rouse Check',
      description: 'When a Rouse Check fails, Hunger increases by 1',
      condition: {
        type: 'roll_result',
        targetId: 'roll-rout',
        operator: '==',
        value: 'failure',
      },
      actions: [
        { type: 'modify_gauge', targetId: 'hunger', value: 1, description: 'Increase Hunger by 1' },
      ],
      enabled: true,
      priority: 3,
    },
    {
      id: 'trigger-hunger-3-messy',
      name: 'Messy Critical Risk',
      description: 'At Hunger 3+, critical successes may be messy',
      condition: {
        type: 'composite',
        targetId: 'composite-hunger-roll',
        compositeLogic: 'AND',
        subConditions: [
          { type: 'gauge_threshold', targetId: 'hunger', operator: '>=', value: 3 },
          { type: 'roll_result', targetId: 'any', operator: '==', value: 'critical' },
        ],
      },
      actions: [
        { type: 'narrative', targetId: 'narrative', value: 'The success is MESSY - blood sprays, witnesses notice, the Beast revels.', description: 'Messy Critical!' },
        { type: 'modify_gauge', targetId: 'hunger', value: -2, description: 'Sate 2 Hunger from messy feed' },
      ],
      enabled: true,
      priority: 4,
    },
  ],
};

/**
 * Helper: Gerar cartas de um baralho de poker
 */
function generatePokerCards() {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const cards = [];

  for (const suit of suits) {
    for (const value of values) {
      cards.push({
        id: `${suit}-${value}`,
        name: `${value} of ${suit}`,
        suit,
        value,
      });
    }
  }
  cards.push({ id: 'joker-red', name: 'Red Joker', suit: 'Joker', value: 'JR' });
  cards.push({ id: 'joker-black', name: 'Black Joker', suit: 'Joker', value: 'JB' });

  return cards;
}

// ========================================================================
// BONUS: D&D 5e Quick Reference (partial)
// ========================================================================

export const dnd5eQuickRef: Partial<UniversalCharacterSheet> = {
  meta: {
    systemName: 'Dungeons & Dragons',
    systemVersion: '5th Edition',
    characterName: 'Thorin Ironforge',
    playerName: 'Player 2',
    createdAt: '2024-01-10T18:00:00.000Z',
    updatedAt: '2024-01-18T21:00:00.000Z',
    schemaVersion: '1.0.0',
    tags: ['dnd', 'fighter', 'party'],
  },
  gauges: [
    { id: 'str', name: 'Strength', category: 'stat', min: 1, max: 20, current: 16, step: 1, description: 'STR +3 modifier' },
    { id: 'dex', name: 'Dexterity', category: 'stat', min: 1, max: 20, current: 12, step: 1, description: 'DEX +1 modifier' },
    { id: 'con', name: 'Constitution', category: 'stat', min: 1, max: 20, current: 14, step: 1, description: 'CON +2 modifier' },
    { id: 'int', name: 'Intelligence', category: 'stat', min: 1, max: 20, current: 10, step: 1, description: 'INT +0 modifier' },
    { id: 'wis', name: 'Wisdom', category: 'stat', min: 1, max: 20, current: 13, step: 1, description: 'WIS +1 modifier' },
    { id: 'cha', name: 'Charisma', category: 'stat', min: 1, max: 20, current: 8, step: 1, description: 'CHA -1 modifier' },
    { id: 'hp', name: 'Hit Points', category: 'resource', min: 0, max: 45, current: 45, step: 1, description: '5d10 + 2*CON' },
    { id: 'ac', name: 'Armor Class', category: 'resource', min: 0, max: 30, current: 18, step: 1, description: 'Chain mail + shield' },
    { id: 'level', name: 'Level', category: 'rank', min: 1, max: 20, current: 5, step: 1 },
    { id: 'xp', name: 'Experience', category: 'currency', min: 0, max: 999999, current: 7200, step: 1 },
    { id: 'gold', name: 'Gold', category: 'currency', min: 0, max: 99999, current: 342, step: 1 },
    { id: 'hit-dice', name: 'Hit Dice', category: 'resource', min: 0, max: 5, current: 5, step: 1 },
  ],
  dieRolls: [
    {
      id: 'roll-attack',
      name: 'Longsword Attack',
      dice: [{ type: 'd20', count: 1, label: 'Attack' }],
      modifiers: [
        { source: 'Strength', value: 3, type: 'flat' },
        { source: 'Proficiency', value: 3, type: 'flat' },
      ],
      successCondition: 'target_number',
      targetNumber: 15, // Example AC
      description: 'd20 + STR + Proficiency vs AC',
    },
    {
      id: 'roll-damage',
      name: 'Longsword Damage',
      dice: [{ type: 'd8', count: 1, label: 'Damage' }],
      modifiers: [{ source: 'Strength', value: 3, type: 'flat' }],
      successCondition: 'sum_total',
      description: '1d8 + 3 slashing damage',
    },
    {
      id: 'roll-second-wind',
      name: 'Second Wind',
      dice: [{ type: 'd10', count: 1, label: 'Heal' }],
      modifiers: [{ source: 'Level', value: 5, type: 'flat' }],
      successCondition: 'sum_total',
      description: '1d10 + Fighter Level HP recovery',
    },
  ],
  fuzzyGauges: [
    {
      id: 'feats',
      name: 'Feats & Features',
      type: 'feats',
      entries: [
        { id: 'feat-great-weapon', label: 'Great Weapon Master', description: '-5 attack / +10 damage option' },
        { id: 'feat-action-surge', label: 'Action Surge (1/short rest)', description: 'One additional action' },
        { id: 'feat-second-wind', label: 'Second Wind (1/short rest)', description: 'Heal 1d10 + level' },
        { id: 'feat-extra-attack', label: 'Extra Attack', description: 'Attack twice per Attack action' },
      ],
    },
    {
      id: 'exhaustion',
      name: 'Exhaustion Levels',
      type: 'ladder',
      entries: [
        { id: 'exh-0', label: 'None', rank: 0, value: 0, description: 'No penalties' },
        { id: 'exh-1', label: 'Level 1', rank: 1, value: -1, description: 'Disadvantage on ability checks' },
        { id: 'exh-2', label: 'Level 2', rank: 2, value: -2, description: 'Speed halved' },
        { id: 'exh-3', label: 'Level 3', rank: 3, value: -3, description: 'Disadvantage on attacks/saves' },
        { id: 'exh-4', label: 'Level 4', rank: 4, value: -4, description: 'HP maximum halved' },
        { id: 'exh-5', label: 'Level 5', rank: 5, value: -5, description: 'Speed reduced to 0' },
        { id: 'exh-6', label: 'Level 6', rank: 6, value: -6, description: 'DEATH' },
      ],
      currentValue: 'None',
    },
  ],
  lookupTables: [
    {
      id: 'table-critical',
      name: 'Critical Hit Table (Optional)',
      type: 'range',
      entries: [
        { id: 'crit-1', key: [1, 5] as [number, number], result: 'Standard double damage' },
        { id: 'crit-2', key: [6, 10] as [number, number], result: 'Double damage + target is shaken' },
        { id: 'crit-3', key: [11, 15] as [number, number], result: 'Triple damage + stunning blow' },
        { id: 'crit-4', key: [16, 19] as [number, number], result: 'Maximum damage + special effect' },
        { id: 'crit-5', key: [20, 20] as [number, number], result: 'INSTANT KILL on non-boss targets' },
      ],
      description: 'Roll d20 on critical hit for severity',
    },
  ],
  triggers: [
    {
      id: 'trigger-hp-zero',
      name: 'Death Saving Throws',
      description: 'When HP reaches 0, begin death saves',
      condition: {
        type: 'gauge_threshold',
        targetId: 'hp',
        operator: '<=',
        value: 0,
      },
      actions: [
        { type: 'narrative', targetId: 'narrative', value: 'You fall unconscious. Begin Death Saving Throws: roll d20, 10+ = success, need 3 before 3 failures.', description: 'Death Saves begin' },
      ],
      enabled: true,
      priority: 1,
    },
  ],
};
