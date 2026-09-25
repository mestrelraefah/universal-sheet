/**
 * ============================================================================
 * PROBABILITY ENGINE - Statistical Analysis for RPG Dice
 * ============================================================================
 * 
 * Calcula distribuições de probabilidade exatas para diferentes mecânicas
 * de resolução de dados. Permite visualizar as chances de sucesso antes
 * de rolar, auxiliando decisões estratégicas.
 * 
 * Algoritmos:
 * - Binomial: Para count_successes (Vampiro)
 * - Convolução: Para sum_total (soma de dados)
 * - CDF/PMF: Funções de distribuição acumulada e de probabilidade
 * ============================================================================
 */

import { DieRollConfig, DieType, DiceEntry, RollModifier } from './types';

// ============================================================================
// TIPOS DE RESULTADO ESTATÍSTICO
// ============================================================================

export interface ProbabilityDistribution {
  /** Valores possíveis e suas probabilidades (0-1) */
  pmf: Map<number, number>;
  /** Probabilidade acumulada P(X <= x) */
  cdf: Map<number, number>;
  /** Valor esperado (média) */
  mean: number;
  /** Desvio padrão */
  stdDev: number;
  /** Valor mínimo possível */
  min: number;
  /** Valor máximo possível */
  max: number;
  /** Modal (valor mais provável) */
  mode: number;
}

export interface SuccessAnalysis {
  /** Probabilidade de sucesso (0-1) */
  successProbability: number;
  /** Probabilidade de sucesso crítico */
  criticalProbability: number;
  /** Probabilidade de falha crítica (botch/fumble) */
  fumbleProbability: number;
  /** Probabilidade de sucesso parcial (se aplicável) */
  partialProbability: number;
  /** Número esperado de successes */
  expectedSuccesses: number;
  /** Probabilidade de obter exatamente N successes */
  successDistribution: Map<number, number>;
  /** Grau de sucesso mais provável */
  likelyDegree: string;
  /** Texto descritivo da análise */
  summary: string;
  /** Classificação de risco */
  riskLevel: 'safe' | 'risky' | 'dangerous' | 'impossible';
}

export interface DiceAnalysis {
  rollConfig: DieRollConfig;
  distribution: ProbabilityDistribution;
  successAnalysis: SuccessAnalysis;
  /** Dados individuais que compõem o pool */
  individualDice: IndividualDiceAnalysis[];
  /** Modificadores aplicados */
  modifierSummary: string;
  /** Comparação com thresholds comuns */
  thresholdComparison: ThresholdComparison[];
}

export interface IndividualDiceAnalysis {
  label: string;
  type: DieType;
  count: number;
  distribution: ProbabilityDistribution;
}

export interface ThresholdComparison {
  threshold: number;
  label: string;
  probability: number;
  color: string;
}

// ============================================================================
// FUNÇÕES MATEMÁTICAS BASE
// ============================================================================

/**
 * Calcula coeficiente binomial C(n, k)
 */
function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

/**
 * Função de massa de probabilidade binomial
 * P(X = k) em n tentativas com probabilidade p
 */
function binomialPMF(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  return binomialCoefficient(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * Converte DieType para número de lados
 */
function dieTypeToSides(type: DieType): number {
  const mapping: Record<string, number> = {
    'd4': 4, 'd6': 6, 'd8': 8, 'd10': 10,
    'd12': 12, 'd20': 20, 'd100': 100,
  };
  return mapping[type] || 6;
}

// ============================================================================
// DISTRIBUIÇÃO DE UM DADO INDIVIDUAL
// ============================================================================

/**
 * Calcula a distribuição de probabilidade de um único dado
 */
export function singleDieDistribution(sides: number): ProbabilityDistribution {
  const pmf = new Map<number, number>();
  const cdf = new Map<number, number>();
  const prob = 1 / sides;

  for (let i = 1; i <= sides; i++) {
    pmf.set(i, prob);
    cdf.set(i, i * prob);
  }

  const mean = (sides + 1) / 2;
  const variance = (sides * sides - 1) / 12;
  const stdDev = Math.sqrt(variance);

  return {
    pmf,
    cdf,
    mean,
    stdDev,
    min: 1,
    max: sides,
    mode: 1, // Uniforme - todos igualmente prováveis
  };
}

/**
 * Calcula a distribuição da soma de N dados de S lados
 * Usando convolução iterativa
 */
export function sumDiceDistribution(count: number, sides: number): ProbabilityDistribution {
  if (count === 0) {
    const pmf = new Map<number, number>([[0, 1]]);
    const cdf = new Map<number, number>([[0, 1]]);
    return { pmf, cdf, mean: 0, stdDev: 0, min: 0, max: 0, mode: 0 };
  }

  if (count === 1) {
    return singleDieDistribution(sides);
  }

  // Convolução: começar com 1 dado, adicionar progressivamente
  let currentPMF = singleDieDistribution(sides).pmf;

  for (let dice = 2; dice <= count; dice++) {
    const newPMF = new Map<number, number>();
    const singleDist = singleDieDistribution(sides).pmf;

    for (const [val1, prob1] of currentPMF) {
      for (const [val2, prob2] of singleDist) {
        const sum = val1 + val2;
        const existing = newPMF.get(sum) || 0;
        newPMF.set(sum, existing + prob1 * prob2);
      }
    }
    currentPMF = newPMF;
  }

  // Calcular CDF
  const sortedKeys = Array.from(currentPMF.keys()).sort((a, b) => a - b);
  const cdf = new Map<number, number>();
  let cumulative = 0;
  for (const key of sortedKeys) {
    cumulative += currentPMF.get(key)!;
    cdf.set(key, cumulative);
  }

  // Estatísticas
  const min = sortedKeys[0];
  const max = sortedKeys[sortedKeys.length - 1];
  const mean = count * (sides + 1) / 2;
  const variance = count * (sides * sides - 1) / 12;
  const stdDev = Math.sqrt(variance);

  // Mode (valor mais provável)
  let mode = min;
  let maxProb = 0;
  for (const [val, prob] of currentPMF) {
    if (prob > maxProb) {
      maxProb = prob;
      mode = val;
    }
  }

  return { pmf: currentPMF, cdf, mean, stdDev, min, max, mode };
}

// ============================================================================
// ANÁLISE POR TIPO DE CONDIÇÃO DE SUCESSO
// ============================================================================

/**
 * Análise para 'count_successes' (Vampiro: pool de d10, success >= threshold)
 */
function analyzeCountSuccesses(
  totalDice: number,
  successThreshold: number,
  dieSides: number = 10
): SuccessAnalysis {
  const p = (dieSides - successThreshold + 1) / dieSides; // P(success per die)
  const pOne = 1 / dieSides; // P(rolling a 1)

  // Distribuição binomial de successes
  const successDistribution = new Map<number, number>();
  let expectedSuccesses = 0;

  for (let k = 0; k <= totalDice; k++) {
    const prob = binomialPMF(totalDice, k, p);
    successDistribution.set(k, prob);
    expectedSuccesses += k * prob;
  }

  // P(at least 1 success) = 1 - P(0 successes)
  const successProbability = 1 - binomialPMF(totalDice, 0, p);

  // P(botch) = P(0 successes AND at least one 1)
  // P(0 successes AND no 1s) = ((dieSides - successThreshold) / dieSides)^n
  const pNoSuccessNoOne = Math.pow((dieSides - successThreshold) / dieSides, totalDice);
  const pZeroSuccesses = binomialPMF(totalDice, 0, p);
  const fumbleProbability = pZeroSuccesses - pNoSuccessNoOne;

  // Graus de sucesso
  const pManySuccesses = 1 - successDistribution.get(0)! - (successDistribution.get(1) || 0);
  const criticalProbability = pManySuccesses > 0.5 ? pManySuccesses : 0;

  // Grau mais provável
  let likelyDegree = 'failure';
  if (expectedSuccesses >= 5) likelyDegree = 'critical';
  else if (expectedSuccesses >= 3) likelyDegree = 'great success';
  else if (expectedSuccesses >= 1) likelyDegree = 'success';
  else if (fumbleProbability > 0.3) likelyDegree = 'likely botch';

  // Risk level
  let riskLevel: SuccessAnalysis['riskLevel'] = 'safe';
  if (successProbability < 0.3) riskLevel = 'dangerous';
  else if (successProbability < 0.6) riskLevel = 'risky';
  if (fumbleProbability > 0.3) riskLevel = 'dangerous';
  if (successProbability < 0.05) riskLevel = 'impossible';

  const summary = successProbability >= 0.8
    ? `Very likely to succeed (${(successProbability * 100).toFixed(1)}%)`
    : successProbability >= 0.5
    ? `Favorable odds (${(successProbability * 100).toFixed(1)}% success)`
    : successProbability >= 0.2
    ? `Risky endeavor (${(successProbability * 100).toFixed(1)}% success)`
    : `Likely to fail (${(successProbability * 100).toFixed(1)}% success)`;

  return {
    successProbability,
    criticalProbability,
    fumbleProbability,
    partialProbability: 0,
    expectedSuccesses,
    successDistribution,
    likelyDegree,
    summary,
    riskLevel,
  };
}

/**
 * Análise para 'target_number' (d20 + mod >= DC)
 */
function analyzeTargetNumber(
  distribution: ProbabilityDistribution,
  targetNumber: number,
  modifiers: RollModifier[]
): SuccessAnalysis {
  // Calcular probabilidade de atingir o target
  let successProbability = 0;
  let criticalProbability = 0;
  let fumbleProbability = 0;

  for (const [value, prob] of distribution.pmf) {
    if (value >= targetNumber) {
      successProbability += prob;
    }
    if (value >= targetNumber + 10) {
      criticalProbability += prob;
    }
    if (value <= 1) {
      fumbleProbability += prob;
    }
  }

  // Verificar advantage/disadvantage nos modificadores
  const hasAdvantage = modifiers.some(m => m.type === 'advantage');
  const hasDisadvantage = modifiers.some(m => m.type === 'disadvantage');

  if (hasAdvantage && !hasDisadvantage) {
    // Advantage: P = 1 - (1-p)^2
    successProbability = 1 - Math.pow(1 - successProbability, 2);
    criticalProbability = 1 - Math.pow(1 - criticalProbability, 2);
    fumbleProbability = Math.pow(fumbleProbability, 2);
  } else if (hasDisadvantage && !hasAdvantage) {
    // Disadvantage: P = p^2
    successProbability = Math.pow(successProbability, 2);
    criticalProbability = Math.pow(criticalProbability, 2);
    fumbleProbability = 1 - Math.pow(1 - fumbleProbability, 2);
  }

  const expectedSuccesses = successProbability;
  const successDistribution = new Map<number, number>();
  successDistribution.set(0, 1 - successProbability);
  successDistribution.set(1, successProbability);

  let likelyDegree = 'failure';
  if (successProbability >= 0.9) likelyDegree = 'critical';
  else if (successProbability >= 0.65) likelyDegree = 'success';
  else if (successProbability >= 0.35) likelyDegree = 'uncertain';
  else if (successProbability >= 0.1) likelyDegree = 'unlikely';

  let riskLevel: SuccessAnalysis['riskLevel'] = 'safe';
  if (successProbability < 0.2) riskLevel = 'dangerous';
  else if (successProbability < 0.5) riskLevel = 'risky';
  if (successProbability < 0.05) riskLevel = 'impossible';

  const summary = successProbability >= 0.85
    ? `Almost certain success (${(successProbability * 100).toFixed(1)}%)`
    : successProbability >= 0.6
    ? `Good chance of success (${(successProbability * 100).toFixed(1)}%)`
    : successProbability >= 0.35
    ? `Coin flip territory (${(successProbability * 100).toFixed(1)}%)`
    : successProbability >= 0.1
    ? `Long shot (${(successProbability * 100).toFixed(1)}%)`
    : `Nearly impossible (${(successProbability * 100).toFixed(1)}%)`;

  return {
    successProbability,
    criticalProbability,
    fumbleProbability,
    partialProbability: 0,
    expectedSuccesses,
    successDistribution,
    likelyDegree,
    summary,
    riskLevel,
  };
}

/**
 * Análise para 'degrees_of_success'
 */
function analyzeDegreesOfSuccess(
  distribution: ProbabilityDistribution,
  targetNumber: number
): SuccessAnalysis {
  let successProbability = 0;
  let criticalProbability = 0;
  let fumbleProbability = 0;
  let partialProbability = 0;

  for (const [value, prob] of distribution.pmf) {
    const diff = value - targetNumber;
    if (diff >= 0) successProbability += prob;
    if (diff >= 10) criticalProbability += prob;
    if (diff >= -5 && diff < 0) partialProbability += prob;
    if (diff < -10) fumbleProbability += prob;
  }

  const successDistribution = new Map<number, number>();
  successDistribution.set(-2, fumbleProbability);
  successDistribution.set(-1, 1 - successProbability - partialProbability - fumbleProbability);
  successDistribution.set(0, partialProbability);
  successDistribution.set(1, successProbability - criticalProbability);
  successDistribution.set(2, criticalProbability);

  let likelyDegree = 'failure';
  if (criticalProbability > 0.3) likelyDegree = 'critical';
  else if (successProbability > 0.5) likelyDegree = 'success';
  else if (partialProbability > 0.3) likelyDegree = 'partial success';
  else if (fumbleProbability > 0.2) likelyDegree = 'fumble';

  let riskLevel: SuccessAnalysis['riskLevel'] = 'safe';
  if (successProbability < 0.3) riskLevel = 'dangerous';
  else if (successProbability < 0.6) riskLevel = 'risky';
  if (fumbleProbability > 0.2) riskLevel = 'dangerous';

  return {
    successProbability,
    criticalProbability,
    fumbleProbability,
    partialProbability,
    expectedSuccesses: successProbability,
    successDistribution,
    likelyDegree,
    summary: `${(successProbability * 100).toFixed(1)}% success • ${(criticalProbability * 100).toFixed(1)}% critical • ${(fumbleProbability * 100).toFixed(1)}% fumble`,
    riskLevel,
  };
}

// ============================================================================
// ANÁLISE PRINCIPAL
// ============================================================================

/**
 * analyzeDiceRoll - Análise completa de uma configuração de rolagem.
 * 
 * Retorna distribuição de probabilidade, chances de sucesso,
 * e comparações com thresholds comuns.
 */
export function analyzeDiceRoll(rollConfig: DieRollConfig): DiceAnalysis {
  // 1. Calcular distribuição base (soma de todos os dados)
  let baseDistribution: ProbabilityDistribution;
  const totalDice = rollConfig.dice.reduce((sum, d) => sum + d.count, 0);

  if (rollConfig.dice.length === 1) {
    // Pool homogêneo
    const sides = dieTypeToSides(rollConfig.dice[0].type);
    baseDistribution = sumDiceDistribution(rollConfig.dice[0].count, sides);
  } else {
    // Pool misto - convolução de diferentes tipos
    baseDistribution = computeMixedPoolDistribution(rollConfig.dice);
  }

  // 2. Aplicar modificadores flat à distribuição
  const flatMod = rollConfig.modifiers
    .filter(m => m.type === 'flat')
    .reduce((sum, m) => sum + m.value, 0);

  const distribution = applyModifier(baseDistribution, flatMod);

  // 3. Análise de sucesso baseada na condição
  let successAnalysis: SuccessAnalysis;

  switch (rollConfig.successCondition) {
    case 'count_successes':
      successAnalysis = analyzeCountSuccesses(
        totalDice,
        rollConfig.successThreshold || 6,
        rollConfig.dice[0] ? dieTypeToSides(rollConfig.dice[0].type) : 10
      );
      break;

    case 'target_number':
      successAnalysis = analyzeTargetNumber(
        distribution,
        rollConfig.targetNumber || 10,
        rollConfig.modifiers
      );
      break;

    case 'degrees_of_success':
      successAnalysis = analyzeDegreesOfSuccess(
        distribution,
        rollConfig.targetNumber || 10
      );
      break;

    case 'sum_total':
      successAnalysis = {
        successProbability: 1,
        criticalProbability: 0,
        fumbleProbability: 0,
        partialProbability: 0,
        expectedSuccesses: distribution.mean,
        successDistribution: new Map([[0, 1]]),
        likelyDegree: 'variable',
        summary: `Result range: ${distribution.min}–${distribution.max} (avg: ${distribution.mean.toFixed(1)})`,
        riskLevel: 'safe',
      };
      break;

    default:
      successAnalysis = {
        successProbability: 0.5,
        criticalProbability: 0,
        fumbleProbability: 0,
        partialProbability: 0,
        expectedSuccesses: 0,
        successDistribution: new Map(),
        likelyDegree: 'unknown',
        summary: 'Analysis not available for this condition type',
        riskLevel: 'risky',
      };
  }

  // 4. Análise individual de cada tipo de dado
  const individualDice: IndividualDiceAnalysis[] = rollConfig.dice.map(d => ({
    label: d.label || d.type,
    type: d.type,
    count: d.count,
    distribution: sumDiceDistribution(d.count, dieTypeToSides(d.type)),
  }));

  // 5. Comparação com thresholds
  const thresholdComparison = generateThresholdComparison(distribution, rollConfig);

  // 6. Resumo de modificadores
  const modifierSummary = rollConfig.modifiers.length > 0
    ? rollConfig.modifiers.map(m => `${m.value > 0 ? '+' : ''}${m.value} ${m.source}`).join(', ')
    : 'No modifiers';

  return {
    rollConfig,
    distribution,
    successAnalysis,
    individualDice,
    modifierSummary,
    thresholdComparison,
  };
}

/**
 * Calcula distribuição de pool misto (diferentes tipos de dados)
 */
function computeMixedPoolDistribution(dice: DiceEntry[]): ProbabilityDistribution {
  // Começar com distribuição vazia (valor 0 com prob 1)
  let currentPMF = new Map<number, number>([[0, 1]]);

  for (const entry of dice) {
    const sides = dieTypeToSides(entry.type);
    const singleDist = sumDiceDistribution(entry.count, sides);

    const newPMF = new Map<number, number>();
    for (const [val1, prob1] of currentPMF) {
      for (const [val2, prob2] of singleDist.pmf) {
        const sum = val1 + val2;
        const existing = newPMF.get(sum) || 0;
        newPMF.set(sum, existing + prob1 * prob2);
      }
    }
    currentPMF = newPMF;
  }

  // Calcular CDF e estatísticas
  const sortedKeys = Array.from(currentPMF.keys()).sort((a, b) => a - b);
  const cdf = new Map<number, number>();
  let cumulative = 0;
  for (const key of sortedKeys) {
    cumulative += currentPMF.get(key)!;
    cdf.set(key, cumulative);
  }

  const min = sortedKeys[0];
  const max = sortedKeys[sortedKeys.length - 1];
  let mean = 0;
  for (const [val, prob] of currentPMF) {
    mean += val * prob;
  }
  let variance = 0;
  for (const [val, prob] of currentPMF) {
    variance += Math.pow(val - mean, 2) * prob;
  }

  let mode = min;
  let maxProb = 0;
  for (const [val, prob] of currentPMF) {
    if (prob > maxProb) {
      maxProb = prob;
      mode = val;
    }
  }

  return { pmf: currentPMF, cdf, mean, stdDev: Math.sqrt(variance), min, max, mode };
}

/**
 * Aplica modificador flat a uma distribuição (desloca todos os valores)
 */
function applyModifier(dist: ProbabilityDistribution, flatMod: number): ProbabilityDistribution {
  if (flatMod === 0) return dist;

  const newPMF = new Map<number, number>();
  const newCDF = new Map<number, number>();

  for (const [val, prob] of dist.pmf) {
    newPMF.set(val + flatMod, prob);
  }

  const sortedKeys = Array.from(newPMF.keys()).sort((a, b) => a - b);
  let cumulative = 0;
  for (const key of sortedKeys) {
    cumulative += newPMF.get(key)!;
    newCDF.set(key, cumulative);
  }

  return {
    ...dist,
    pmf: newPMF,
    cdf: newCDF,
    mean: dist.mean + flatMod,
    min: dist.min + flatMod,
    max: dist.max + flatMod,
    mode: dist.mode + flatMod,
  };
}

/**
 * Gera comparações com thresholds comuns baseado no tipo de sistema
 */
function generateThresholdComparison(
  distribution: ProbabilityDistribution,
  config: DieRollConfig
): ThresholdComparison[] {
  const comparisons: ThresholdComparison[] = [];

  if (config.successCondition === 'count_successes') {
    // Para Vampiro: mostrar P(X successes) para X = 1, 3, 5, 7
    const totalDice = config.dice.reduce((sum, d) => sum + d.count, 0);
    const thresholds = [1, 2, 3, 5, Math.min(7, totalDice)];
    const labels = ['1 success', '2 successes', '3 successes', '5 successes', `${Math.min(7, totalDice)} successes`];

    for (let i = 0; i < thresholds.length; i++) {
      let prob = 0;
      for (const [k, p] of distribution.pmf) {
        if (k >= thresholds[i]) prob += p;
      }
      comparisons.push({
        threshold: thresholds[i],
        label: labels[i],
        probability: prob,
        color: prob >= 0.7 ? '#10b981' : prob >= 0.4 ? '#f59e0b' : '#ef4444',
      });
    }
  } else if (config.successCondition === 'target_number' || config.successCondition === 'degrees_of_success') {
    // Para d20: mostrar P(>= DC) para DCs comuns
    const baseTarget = config.targetNumber || 10;
    const targets = [
      { t: baseTarget - 5, label: `Easy (${baseTarget - 5})` },
      { t: baseTarget, label: `Target (${baseTarget})` },
      { t: baseTarget + 5, label: `Hard (${baseTarget + 5})` },
    ];

    for (const { t, label } of targets) {
      let prob = 0;
      for (const [val, p] of distribution.pmf) {
        if (val >= t) prob += p;
      }
      comparisons.push({
        threshold: t,
        label,
        probability: prob,
        color: prob >= 0.7 ? '#10b981' : prob >= 0.4 ? '#f59e0b' : '#ef4444',
      });
    }
  }

  return comparisons;
}

// ============================================================================
// UTILITÁRIOS DE FORMATAÇÃO
// ============================================================================

/**
 * Formata probabilidade como texto legível
 */
export function formatProbability(prob: number): string {
  const pct = (prob * 100).toFixed(1);
  if (prob >= 0.95) return `${pct}% (Almost Certain)`;
  if (prob >= 0.75) return `${pct}% (Very Likely)`;
  if (prob >= 0.55) return `${pct}% (Likely)`;
  if (prob >= 0.45) return `${pct}% (Coin Flip)`;
  if (prob >= 0.25) return `${pct}% (Unlikely)`;
  if (prob >= 0.05) return `${pct}% (Very Unlikely)`;
  return `${pct}% (Nearly Impossible)`;
}

/**
 * Retorna cor baseada na probabilidade
 */
export function getProbabilityColor(prob: number): string {
  if (prob >= 0.75) return '#10b981'; // green
  if (prob >= 0.5) return '#f59e0b';  // amber
  if (prob >= 0.25) return '#f97316'; // orange
  return '#ef4444';                    // red
}
