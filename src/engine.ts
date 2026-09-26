/**
 * ============================================================================
 * RPG SHEET ENGINE - RULE ENGINE
 * ============================================================================
 * 
 * Motor de resolução puro (sem dependências de UI) que recebe configurações
 * e resolve ações mecânicas. Segue o padrão Strategy para permitir que
 * diferentes sistemas injetem suas próprias fórmulas.
 * 
 * Princípios:
 * - Pureza: Funções puras, sem efeitos colaterais no estado global.
 * - Composabilidade: Resultados podem ser encadeados.
 * - Extensibilidade: Novas estratégias de resolução via registro.
 * - Determinismo: Mesmo input = mesmo output (exceto rolagens).
 * ============================================================================
 */

import {
  DieRollConfig,
  RollResult,
  SingleDieResult,
  Gauge,
  GaugeUpdateResult,
  CardDeck,
  CardDrawResult,
  LookupTable,
  TableLookupResult,
  Contest,
  ContestResult,
  ContestResolution,
  TriggerNode,
  TriggerConditionConfig,
  UniversalCharacterSheet,
  EngineState,
  EngineAction,
  RollModifier,
} from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gera um ID único para ações do engine
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Rola um dado de N lados
 */
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Converte DieType para número de lados
 */
function dieTypeToSides(type: string): number {
  const mapping: Record<string, number> = {
    'd4': 4, 'd6': 6, 'd8': 8, 'd10': 10,
    'd12': 12, 'd20': 20, 'd100': 100,
  };
  return mapping[type] || 6;
}

// ============================================================================
// DIE ROLL RESOLUTION
// ============================================================================

/**
 * resolveDieRoll - Resolve uma configuração de rolagem de dados.
 * 
 * Strategy Pattern: A função suporta múltiplas condições de sucesso
 * através de um switch/discriminator, permitindo que cada sistema
 * defina como "sucesso" é calculado.
 * 
 * @param rollConfig - Configuração completa da rolagem
 * @returns RollResult com todos os detalhes da resolução
 */
export function resolveDieRoll(rollConfig: DieRollConfig): RollResult {
  const allDiceResults: SingleDieResult[] = [];
  let rawTotal = 0;
  let expressionParts: string[] = [];

  // 1. Rolar todos os dados do pool
  for (const diceEntry of rollConfig.dice) {
    const sides = dieTypeToSides(diceEntry.type);
    
    for (let i = 0; i < diceEntry.count; i++) {
      let value = rollDie(sides);
      let exploded = false;

      // Dados explosivos (Savage Worlds): se tirar o máximo, rola de novo
      if (rollConfig.exploding && value === sides) {
        exploded = true;
        let extraRoll = rollDie(sides);
        value += extraRoll;
        while (extraRoll === sides) {
          extraRoll = rollDie(sides);
          value += extraRoll;
        }
      }

      const result: SingleDieResult = {
        type: diceEntry.type,
        value,
        kept: true, // Será ajustado depois se keepHighest/keepLowest
        exploded,
        label: diceEntry.label,
      };
      allDiceResults.push(result);
    }
  }

  // 2. Aplicar keepHighest/keepLowest (D&D Advantage/Disadvantage)
  if (rollConfig.keepHighest !== undefined) {
    const sorted = [...allDiceResults].sort((a, b) => b.value - a.value);
    const keptValues = new Set(sorted.slice(0, rollConfig.keepHighest));
    allDiceResults.forEach(r => {
      r.kept = keptValues.has(r);
    });
  } else if (rollConfig.keepLowest !== undefined) {
    const sorted = [...allDiceResults].sort((a, b) => a.value - b.value);
    const keptValues = new Set(sorted.slice(0, rollConfig.keepLowest));
    allDiceResults.forEach(r => {
      r.kept = keptValues.has(r);
    });
  }

  // 3. Calcular total dos dados mantidos
  const keptDice = allDiceResults.filter(r => r.kept);
  rawTotal = keptDice.reduce((sum, r) => sum + r.value, 0);

  // 4. Aplicar modificadores
  let modifierTotal = 0;
  for (const mod of rollConfig.modifiers) {
    switch (mod.type) {
      case 'flat':
        modifierTotal += mod.value;
        break;
      case 'multiplier':
        modifierTotal = Math.floor(rawTotal * mod.value) - rawTotal;
        break;
      case 'advantage':
        // Advantage: rola 2x, pega maior (já tratado em keepHighest)
        break;
      case 'disadvantage':
        // Disadvantage: rola 2x, pega menor (já tratado em keepLowest)
        break;
    }
  }

  const total = rawTotal + modifierTotal;

  // 5. Determinar sucesso baseado na condição
  const isSuccess = evaluateSuccess(rollConfig, total, allDiceResults);
  const successes = countSuccesses(rollConfig, allDiceResults);
  const degreeOfSuccess = evaluateDegreeOfSuccess(rollConfig, total);

  // 6. Montar expressão legível
  const diceStr = keptDice.map(r => r.value).join(',');
  const modStr = rollConfig.modifiers
    .filter(m => m.type === 'flat')
    .map(m => `${m.value > 0 ? '+' : ''}${m.value}`)
    .join(' ');
  expressionParts.push(`[${diceStr}]`);
  if (modStr) expressionParts.push(modStr);

  return {
    rollId: rollConfig.id,
    diceResults: allDiceResults,
    modifiers: rollConfig.modifiers,
    total,
    successes,
    degreeOfSuccess,
    isSuccess,
    rawExpression: `${rollConfig.dice.map(d => `${d.count}${d.type}`).join('+')} ${modStr} = ${expressionParts.join(' ')} = ${total}`,
  };
}

/**
 * Avalia se a rolagem foi bem-sucedida baseado na condição configurada
 */
function evaluateSuccess(
  config: DieRollConfig,
  total: number,
  diceResults: SingleDieResult[]
): boolean {
  switch (config.successCondition) {
    case 'target_number':
      return total >= (config.targetNumber || 0);
    
    case 'count_successes':
      // Conta dados individuais >= threshold (Vampiro: d10 >= 8)
      const threshold = config.successThreshold || 8;
      const keptDice = diceResults.filter(r => r.kept);
      const successCount = keptDice.filter(r => r.value >= threshold).length;
      return successCount > 0;
    
    case 'degrees_of_success':
      return total >= (config.targetNumber || 0);
    
    case 'sum_total':
      return true; // Sempre "sucesso", o total é o resultado
    
    case 'opposed':
    case 'lookup':
    case 'custom':
      return true; // Resolvido externamente
    
    default:
      return false;
  }
}

/**
 * Conta successes para sistemas como Vampiro (count_successes)
 */
function countSuccesses(
  config: DieRollConfig,
  diceResults: SingleDieResult[]
): number | undefined {
  if (config.successCondition !== 'count_successes') return undefined;
  
  const threshold = config.successThreshold || 8;
  const keptDice = diceResults.filter(r => r.kept);
  let count = keptDice.filter(r => r.value >= threshold).length;
  
  // Botch: se não tem successes E tem pelo menos um 1
  const ones = keptDice.filter(r => r.value === 1).length;
  if (count === 0 && ones > 0) count = -ones; // Botch!
  
  return count;
}

/**
 * Avalia grau de sucesso (critical, success, partial, failure, fumble)
 */
function evaluateDegreeOfSuccess(
  config: DieRollConfig,
  total: number
): string | undefined {
  if (config.successCondition !== 'degrees_of_success') return undefined;
  
  const target = config.targetNumber || 10;
  const diff = total - target;
  
  if (diff >= 10) return 'critical';
  if (diff >= 0) return 'success';
  if (diff >= -5) return 'partial_success';
  if (diff >= -10) return 'failure';
  return 'fumble';
}

// ============================================================================
// GAUGE UPDATE
// ============================================================================

/**
 * updateGauge - Atualiza um gauge com um delta (positivo ou negativo).
 * 
 * Respeita min/max e retorna triggers que devem ser verificados.
 * Implementa o padrão Command: a atualização é um comando que pode
 * ser desfeito/refeito via history.
 * 
 * @param gauge - O gauge a ser atualizado
 * @param delta - Valor a adicionar (negativo para reduzir)
 * @returns GaugeUpdateResult com o resultado e triggers a verificar
 */
export function updateGauge(gauge: Gauge, delta: number): GaugeUpdateResult {
  const previousValue = gauge.current;
  let newValue = gauge.current + (delta * gauge.step);
  
  // Clamp entre min e max
  newValue = Math.max(gauge.min, Math.min(gauge.max, newValue));
  
  // Atualizar o gauge (imutável - retorna novo objeto)
  const updatedGauge: Gauge = { ...gauge, current: newValue };

  return {
    gaugeId: gauge.id,
    previousValue,
    newValue,
    delta,
    triggersFired: [], // Será preenchido pelo engine principal
  };
}

/**
 * getGaugePercentage - Retorna a porcentagem atual do gauge (para UI)
 */
export function getGaugePercentage(gauge: Gauge): number {
  const range = gauge.max - gauge.min;
  if (range === 0) return 100;
  return ((gauge.current - gauge.min) / range) * 100;
}

// ============================================================================
// CARD DRAW
// ============================================================================

/**
 * drawCard - Saca uma carta do baralho.
 * 
 * Implementa a mecânica de draw pile / discard pile com
 * reshuffle automático quando o monte acaba.
 * 
 * @param deck - O baralho de onde sacar
 * @returns CardDrawResult com a carta sacada e estado do deck
 */
export function drawCard(deck: CardDeck): CardDrawResult {
  let drawPile = [...deck.drawPile];
  let discardPile = [...deck.discardPile];
  let shouldReshuffle = false;

  // Se o monte de compra está vazio, embaralhar descarte
  if (drawPile.length === 0) {
    if (deck.shuffleOnEmpty && discardPile.length > 0) {
      drawPile = shuffleArray([...discardPile]);
      discardPile = [];
      shouldReshuffle = true;
    } else {
      // Baralho exaurido - retornar carta vazia
      return {
        deckId: deck.id,
        card: { id: 'empty', name: 'No cards remaining' },
        remainingInDeck: 0,
        shouldReshuffle: false,
      };
    }
  }

  // Sacar do topo
  const cardId = drawPile.pop()!;
  const card = deck.cards.find(c => c.id === cardId) || { id: cardId, name: 'Unknown Card' };

  return {
    deckId: deck.id,
    card,
    remainingInDeck: drawPile.length,
    shouldReshuffle,
  };
}

/**
 * shuffleArray - Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * createStandardDeck - Cria um baralho padrão de poker
 */
export function createStandardDeck(id: string, name: string): CardDeck {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const cards: import('./types').Card[] = [];

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
  // Jokers
  cards.push({ id: 'joker-red', name: 'Red Joker', suit: 'Joker', value: 'JR' });
  cards.push({ id: 'joker-black', name: 'Black Joker', suit: 'Joker', value: 'JB' });

  const allIds = cards.map(c => c.id);

  return {
    id,
    name,
    type: 'poker',
    cards,
    drawPile: shuffleArray(allIds),
    discardPile: [],
    hand: [],
    shuffleOnEmpty: true,
  };
}

// ============================================================================
// TABLE LOOKUP
// ============================================================================

/**
 * lookupTable - Consulta uma tabela de lookup com um valor de entrada.
 * 
 * Suporta ranges (1-5), valores exatos, e matrizes.
 * 
 * @param table - A tabela a consultar
 * @param inputValue - O valor de entrada (número ou string)
 * @returns TableLookupResult com a entrada encontrada
 */
export function lookupTable(table: LookupTable, inputValue: string | number): TableLookupResult {
  let matchedEntry = null;
  let defaultUsed = false;

  switch (table.type) {
    case 'range':
      // Verificar se inputValue está dentro de algum range
      for (const entry of table.entries) {
        if (Array.isArray(entry.key)) {
          const [min, max] = entry.key;
          const numValue = typeof inputValue === 'string' ? parseInt(inputValue) : inputValue;
          if (numValue >= min && numValue <= max) {
            matchedEntry = entry;
            break;
          }
        }
      }
      break;

    case 'exact':
      // Match exato por string ou número
      for (const entry of table.entries) {
        if (entry.key === inputValue || String(entry.key) === String(inputValue)) {
          matchedEntry = entry;
          break;
        }
      }
      break;

    case 'matrix':
    case 'nested':
    case 'custom':
      // Para matrizes, o inputValue pode ser "row,col"
      for (const entry of table.entries) {
        if (String(entry.key) === String(inputValue)) {
          matchedEntry = entry;
          break;
        }
      }
      break;
  }

  // Se não encontrou, usar resultado padrão
  if (!matchedEntry && table.defaultResult) {
    defaultUsed = true;
    matchedEntry = {
      id: 'default',
      key: inputValue,
      result: table.defaultResult,
    };
  }

  return {
    tableId: table.id,
    inputValue,
    matchedEntry,
    defaultUsed,
  };
}

// ============================================================================
// CONTEST RESOLUTION
// ============================================================================

/**
 * resolveContest - Resolve um conteste entre participantes.
 * 
 * Strategy Pattern: Diferentes tipos de conteste usam diferentes
 * algoritmos de resolução.
 * 
 * @param contest - O conteste a resolver
 * @param rollResults - Resultados das rolagens dos participantes (já resolvidos)
 * @returns ContestResult com a resolução
 */
export function resolveContest(
  contest: Contest,
  rollResults: Map<string, RollResult>
): ContestResult {
  let resolution: ContestResolution;

  switch (contest.type) {
    case 'simple_opposed':
      resolution = resolveSimpleOpposed(contest, rollResults);
      break;
    
    case 'task_resolution':
      resolution = resolveTaskResolution(contest, rollResults);
      break;
    
    case 'extended':
      resolution = resolveExtended(contest, rollResults);
      break;
    
    case 'resource_vs_resource':
      resolution = resolveResourceVsResource(contest, rollResults);
      break;
    
    default:
      resolution = {
        outcome: 'tie',
        effects: ['Contest type not implemented - defaulting to tie'],
      };
  }

  return {
    contestId: contest.id,
    resolution,
    triggersFired: [],
  };
}

function resolveSimpleOpposed(
  contest: Contest,
  rollResults: Map<string, RollResult>
): ContestResolution {
  const results = Array.from(rollResults.entries());
  if (results.length < 2) {
    return { outcome: 'tie', effects: ['Not enough participants'] };
  }

  const [attackerId, attackerResult] = results[0];
  const [defenderId, defenderResult] = results[1];

  const attackerTotal = attackerResult.total;
  const defenderTotal = defenderResult.total;

  if (attackerTotal > defenderTotal) {
    return {
      winnerId: attackerId,
      loserId: defenderId,
      margin: attackerTotal - defenderTotal,
      outcome: attackerTotal - defenderTotal >= 10 ? 'critical' : 'win',
      effects: [`Attacker wins by ${attackerTotal - defenderTotal}`],
    };
  } else if (defenderTotal > attackerTotal) {
    return {
      winnerId: defenderId,
      loserId: attackerId,
      margin: defenderTotal - attackerTotal,
      outcome: defenderTotal - attackerTotal >= 10 ? 'critical' : 'win',
      effects: [`Defender wins by ${defenderTotal - attackerTotal}`],
    };
  } else {
    return {
      outcome: 'tie',
      effects: [contest.stakes?.tieResult || 'Contest is a tie - no effect'],
    };
  }
}

function resolveTaskResolution(
  contest: Contest,
  rollResults: Map<string, RollResult>
): ContestResolution {
  const results = Array.from(rollResults.entries());
  if (results.length === 0) {
    return { outcome: 'tie', effects: ['No roll results provided'] };
  }

  const [participantId, result] = results[0];
  const targetNumber = contest.metadata?.['targetNumber'] as number || 10;

  if (result.total >= targetNumber) {
    const margin = result.total - targetNumber;
    return {
      winnerId: participantId,
      margin,
      outcome: margin >= 5 ? 'critical' : 'win',
      effects: [`Task succeeded with margin ${margin}`],
    };
  } else {
    return {
      loserId: participantId,
      margin: targetNumber - result.total,
      outcome: result.total <= 1 ? 'fumble' : 'loss',
      effects: [`Task failed by ${targetNumber - result.total}`],
    };
  }
}

function resolveExtended(
  contest: Contest,
  rollResults: Map<string, RollResult>
): ContestResolution {
  // Conteste estendido: acumular successes até threshold
  const targetSuccesses = contest.metadata?.['targetSuccesses'] as number || 5;
  let totalSuccesses = 0;

  for (const [, result] of rollResults) {
    if (result.successes !== undefined) {
      totalSuccesses += result.successes;
    } else if (result.isSuccess) {
      totalSuccesses += 1;
    }
  }

  if (totalSuccesses >= targetSuccesses) {
    return {
      winnerId: contest.participants[0]?.id,
      outcome: 'win',
      effects: [`Extended task completed: ${totalSuccesses}/${targetSuccesses} successes`],
    };
  } else {
    return {
      outcome: 'loss',
      effects: [`Extended task incomplete: ${totalSuccesses}/${targetSuccesses} successes`],
    };
  }
}

function resolveResourceVsResource(
  contest: Contest,
  rollResults: Map<string, RollResult>
): ContestResolution {
  // Ambos gastam recurso, quem gastar mais vence (ou empata)
  return resolveSimpleOpposed(contest, rollResults);
}

// ============================================================================
// TRIGGER EVALUATION
// ============================================================================

/**
 * evaluateTriggers - Verifica quais triggers devem ser disparados
 * dado o estado atual da ficha.
 * 
 * @param triggers - Lista de triggers da ficha
 * @param sheet - Estado atual da ficha
 * @returns Lista de triggers que devem ser executados
 */
export function evaluateTriggers(
  triggers: TriggerNode[],
  sheet: UniversalCharacterSheet
): TriggerNode[] {
  return triggers
    .filter(t => t.enabled)
    .filter(t => evaluateCondition(t.condition, sheet))
    .sort((a, b) => a.priority - b.priority);
}

function evaluateCondition(
  condition: TriggerConditionConfig,
  sheet: UniversalCharacterSheet
): boolean {
  switch (condition.type) {
    case 'gauge_threshold': {
      const gauge = sheet.gauges.find(g => g.id === condition.targetId);
      if (!gauge || condition.value === undefined) return false;
      const numValue = Number(condition.value);
      switch (condition.operator) {
        case '<=': return gauge.current <= numValue;
        case '>=': return gauge.current >= numValue;
        case '==': return gauge.current === numValue;
        case '!=': return gauge.current !== numValue;
        case '<': return gauge.current < numValue;
        case '>': return gauge.current > numValue;
        default: return false;
      }
    }
    
    case 'fuzzy_activated': {
      const fuzzy = sheet.fuzzyGauges.find(f => f.id === condition.targetId);
      if (!fuzzy) return false;
      return fuzzy.activeConditions?.includes(condition.value as string) || false;
    }
    
    case 'composite': {
      if (!condition.subConditions) return false;
      const results = condition.subConditions.map(c => evaluateCondition(c, sheet));
      if (condition.compositeLogic === 'AND') {
        return results.every(r => r);
      } else {
        return results.some(r => r);
      }
    }
    
    default:
      return false;
  }
}

// ============================================================================
// ENGINE STATE MANAGEMENT
// ============================================================================

/**
 * createInitialState - Cria o estado inicial do engine
 */
export function createInitialState(sheet: UniversalCharacterSheet): EngineState {
  return {
    sheet,
    history: [],
    log: [`Engine initialized for "${sheet.meta.characterName}" (${sheet.meta.systemName})`],
  };
}

/**
 * addActionToHistory - Adiciona uma ação ao histórico (imutável)
 */
export function addActionToHistory(
  state: EngineState,
  action: Omit<EngineAction, 'id' | 'timestamp'>
): EngineState {
  const newAction: EngineAction = {
    ...action,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  return {
    ...state,
    history: [...state.history, newAction],
    log: [...state.log, `[${newAction.timestamp}] ${action.type}: ${JSON.stringify(action.input)}`],
  };
}
