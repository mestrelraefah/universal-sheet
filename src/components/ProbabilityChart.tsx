/**
 * ============================================================================
 * COMPONENT: ProbabilityChart
 * ============================================================================
 * 
 * Visualizações estatísticas das chances de sucesso em rolagens de dados.
 * Inclui:
 * - Gráfico de barras da distribuição (PMF)
 * - Gauge circular de probabilidade de sucesso
 * - Barras de comparação com thresholds
 * - Indicador de risco
 * 
 * Design: SVG puro, sem dependências externas de gráficos.
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { DieRollConfig } from '../types';
import {
  analyzeDiceRoll,
  DiceAnalysis,
  getProbabilityColor,
} from '../probability';

interface ProbabilityChartProps {
  rollConfig: DieRollConfig;
  compact?: boolean;
  onRoll?: () => void;
  lastResult?: { total: number; isSuccess: boolean; successes?: number; rawExpression: string } | null;
}

// ============================================================================
// GAUGE CIRCULAR DE PROBABILIDADE
// ============================================================================

const ProbabilityGauge: React.FC<{ probability: number; size?: number; label: string }> = ({
  probability,
  size = 120,
  label,
}) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - probability);
  const color = getProbabilityColor(probability);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(55, 65, 81, 0.5)"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold" style={{ color }}>
          {(probability * 100).toFixed(0)}%
        </span>
      </div>
      <span className="text-xs text-gray-500 mt-2">{label}</span>
    </div>
  );
};

// ============================================================================
// GRÁFICO DE BARRAS DA DISTRIBUIÇÃO
// ============================================================================

const DistributionChart: React.FC<{ analysis: DiceAnalysis; height?: number }> = ({
  analysis,
  height = 140,
}) => {
  const { distribution, successAnalysis, rollConfig } = analysis;

  // Se é count_successes, mostrar distribuição de successes
  const isCountSuccesses = rollConfig.successCondition === 'count_successes';

  const dataPoints = useMemo(() => {
    if (isCountSuccesses) {
      // Mostrar distribuição de successes (0, 1, 2, 3, ...)
      const points: { value: number; prob: number }[] = [];
      const sortedKeys = Array.from(successAnalysis.successDistribution.keys()).sort((a, b) => a - b);
      for (const key of sortedKeys) {
        points.push({ value: key, prob: successAnalysis.successDistribution.get(key)! });
      }
      return points;
    } else {
      // Mostrar PMF da distribuição de soma
      const points: { value: number; prob: number }[] = [];
      const sortedKeys = Array.from(distribution.pmf.keys()).sort((a, b) => a - b);

      // Limitar a 30 barras para visualização
      if (sortedKeys.length > 30) {
        const step = Math.ceil(sortedKeys.length / 30);
        for (let i = 0; i < sortedKeys.length; i += step) {
          const key = sortedKeys[i];
          points.push({ value: key, prob: distribution.pmf.get(key)! });
        }
      } else {
        for (const key of sortedKeys) {
          points.push({ value: key, prob: distribution.pmf.get(key)! });
        }
      }
      return points;
    }
  }, [distribution, successAnalysis, isCountSuccesses]);

  if (dataPoints.length === 0) return null;

  const maxProb = Math.max(...dataPoints.map(d => d.prob));
  const barWidth = Math.max(4, Math.min(24, (300 - 40) / dataPoints.length - 2));
  const chartWidth = dataPoints.length * (barWidth + 2) + 40;
  const targetValue = isCountSuccesses ? 1 : (rollConfig.targetNumber || rollConfig.successThreshold || 0);

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartWidth, 280)} height={height + 30} className="block">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(fraction => (
          <g key={fraction}>
            <line
              x1={30}
              y1={height - fraction * (height - 20)}
              x2={chartWidth - 10}
              y2={height - fraction * (height - 20)}
              stroke="rgba(75, 85, 99, 0.2)"
              strokeDasharray="2,4"
            />
            <text
              x={25}
              y={height - fraction * (height - 20) + 3}
              textAnchor="end"
              className="fill-gray-600"
              fontSize="8"
            >
              {(fraction * maxProb * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        {/* Bars */}
        {dataPoints.map((point, i) => {
          const barHeight = (point.prob / maxProb) * (height - 20);
          const x = 32 + i * (barWidth + 2);
          const y = height - barHeight;

          // Color based on whether this value meets the threshold
          let barColor = '#6366f1'; // indigo default
          if (isCountSuccesses) {
            barColor = point.value >= 1 ? '#10b981' : '#ef4444';
            if (point.value < 0) barColor = '#dc2626'; // botch
          } else {
            barColor = point.value >= targetValue ? '#10b981' : '#6366f1';
          }

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                opacity={0.8}
                rx={2}
                className="transition-all duration-300 hover:opacity-100"
              />
              {/* Value label (only show every Nth for readability) */}
              {(dataPoints.length <= 15 || i % Math.ceil(dataPoints.length / 10) === 0) && (
                <text
                  x={x + barWidth / 2}
                  y={height + 12}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize="8"
                >
                  {point.value}
                </text>
              )}
            </g>
          );
        })}

        {/* Target line */}
        {!isCountSuccesses && targetValue > 0 && (
          <>
            {(() => {
              const targetIndex = dataPoints.findIndex(d => d.value >= targetValue);
              if (targetIndex === -1) return null;
              const x = 32 + targetIndex * (barWidth + 2) - 1;
              return (
                <g>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={height}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <text
                    x={x + 4}
                    y={12}
                    className="fill-amber-400"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    DC {targetValue}
                  </text>
                </g>
              );
            })()}
          </>
        )}

        {/* Axis labels */}
        <text
          x={chartWidth / 2}
          y={height + 26}
          textAnchor="middle"
          className="fill-gray-500"
          fontSize="9"
        >
          {isCountSuccesses ? 'Number of Successes' : 'Roll Result'}
        </text>
      </svg>
    </div>
  );
};

// ============================================================================
// BARRAS DE COMPARAÇÃO COM THRESHOLDS
// ============================================================================

const ThresholdBars: React.FC<{ analysis: DiceAnalysis }> = ({ analysis }) => {
  const { thresholdComparison } = analysis;

  if (thresholdComparison.length === 0) return null;

  return (
    <div className="space-y-2">
      {thresholdComparison.map((comp, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-28 truncate">{comp.label}</span>
          <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(2, comp.probability * 100)}%`,
                backgroundColor: comp.color,
              }}
            />
          </div>
          <span className="text-xs font-mono w-14 text-right" style={{ color: comp.color }}>
            {(comp.probability * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// INDICADOR DE RISCO
// ============================================================================

const RiskIndicator: React.FC<{ riskLevel: string }> = ({ riskLevel }) => {
  const config: Record<string, { color: string; icon: string; bg: string }> = {
    safe: { color: 'text-emerald-400', icon: '🛡️', bg: 'bg-emerald-900/20 border-emerald-700/30' },
    risky: { color: 'text-amber-400', icon: '⚠️', bg: 'bg-amber-900/20 border-amber-700/30' },
    dangerous: { color: 'text-orange-400', icon: '💀', bg: 'bg-orange-900/20 border-orange-700/30' },
    impossible: { color: 'text-red-400', icon: '☠️', bg: 'bg-red-900/20 border-red-700/30' },
  };

  const c = config[riskLevel] || config.risky;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${c.bg} ${c.color}`}>
      <span>{c.icon}</span>
      <span className="capitalize">{riskLevel}</span>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ rollConfig, compact = false, onRoll, lastResult }) => {
  const analysis = useMemo(() => analyzeDiceRoll(rollConfig), [rollConfig]);
  const { distribution, successAnalysis } = analysis;

  return (
    <div className={`rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-200">{rollConfig.name}</h3>
          {rollConfig.description && (
            <p className="text-xs text-gray-500 mt-0.5">{rollConfig.description}</p>
          )}
        </div>
        <RiskIndicator riskLevel={successAnalysis.riskLevel} />
      </div>

      {/* Dice Pool Info */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {rollConfig.dice.map((d, i) => (
          <span key={i} className="text-xs bg-indigo-900/30 px-2 py-1 rounded border border-indigo-700/30 text-indigo-300">
            {d.count}× {d.type}
          </span>
        ))}
        {analysis.modifierSummary !== 'No modifiers' && (
          <span className="text-xs bg-blue-900/20 px-2 py-1 rounded border border-blue-700/30 text-blue-300">
            {analysis.modifierSummary}
          </span>
        )}
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Success Probability Gauge */}
        <div className="relative flex flex-col items-center">
          <ProbabilityGauge
            probability={successAnalysis.successProbability}
            size={90}
            label="Success"
          />
        </div>

        {/* Expected Value */}
        <div className="flex flex-col items-center justify-center bg-gray-800/40 rounded-lg p-3">
          <span className="text-xs text-gray-500 mb-1">
            {rollConfig.successCondition === 'count_successes' ? 'Avg. Successes' : 'Mean Result'}
          </span>
          <span className="text-xl font-bold text-white">
            {successAnalysis.expectedSuccesses.toFixed(1)}
          </span>
          <span className="text-xs text-gray-600">
            {rollConfig.successCondition === 'count_successes'
              ? `of ${rollConfig.dice.reduce((s, d) => s + d.count, 0)} dice`
              : `range [${distribution.min}, ${distribution.max}]`
            }
          </span>
        </div>

        {/* Critical/Fumble */}
        <div className="flex flex-col items-center justify-center bg-gray-800/40 rounded-lg p-3">
          <span className="text-xs text-gray-500 mb-1">Critical</span>
          <span className="text-lg font-bold text-emerald-400">
            {(successAnalysis.criticalProbability * 100).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-600">Best outcome</span>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-800/40 rounded-lg p-3">
          <span className="text-xs text-gray-500 mb-1">
            {rollConfig.successCondition === 'count_successes' ? 'Botch' : 'Fumble'}
          </span>
          <span className="text-lg font-bold text-red-400">
            {(successAnalysis.fumbleProbability * 100).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-600">Worst outcome</span>
        </div>
      </div>

      {/* Distribution Chart */}
      {!compact && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">
            {rollConfig.successCondition === 'count_successes'
              ? 'Success Distribution'
              : 'Result Distribution'}
          </p>
          <DistributionChart analysis={analysis} />
        </div>
      )}

      {/* Threshold Comparison */}
      {!compact && analysis.thresholdComparison.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">
            Difficulty Comparison
          </p>
          <ThresholdBars analysis={analysis} />
        </div>
      )}

      {/* Roll Button & Last Result */}
      <div className="pt-3 border-t border-gray-800/50 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 italic">{successAnalysis.summary}</p>
          {rollConfig.successCondition === 'count_successes' && (
            <p className="text-xs text-gray-600 mt-1">
              Each die succeeds on ≥{rollConfig.successThreshold} ({((10 - (rollConfig.successThreshold || 6) + 1) / 10 * 100).toFixed(0)}% per die)
            </p>
          )}
        </div>
        {onRoll && (
          <button
            onClick={onRoll}
            className="shrink-0 ml-3 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-900/30 active:scale-95"
          >
            🎲 Roll
          </button>
        )}
      </div>

      {/* Last Roll Result */}
      {lastResult && (
        <div className={`mt-3 p-3 rounded-lg border animate-fade-in ${
          lastResult.isSuccess
            ? 'bg-emerald-900/20 border-emerald-700/30'
            : 'bg-red-900/20 border-red-700/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Actual Roll:</p>
              <p className="text-xs font-mono text-gray-300">{lastResult.rawExpression}</p>
            </div>
            <div className="text-right">
              <span className={`text-xl font-bold ${lastResult.isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastResult.total}
              </span>
              {lastResult.successes !== undefined && (
                <p className={`text-xs ${lastResult.successes > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lastResult.successes} successes{lastResult.successes < 0 ? ' (BOTCH!)' : ''}
                </p>
              )}
            </div>
          </div>
          {/* Comparison: expected vs actual */}
          <div className="mt-2 pt-2 border-t border-gray-700/30 flex items-center gap-2">
            <span className="text-xs text-gray-500">Expected:</span>
            <span className="text-xs text-gray-400 font-mono">{successAnalysis.expectedSuccesses.toFixed(1)}</span>
            <span className="text-xs text-gray-600">vs</span>
            <span className="text-xs text-gray-400 font-mono">
              {lastResult.successes !== undefined ? lastResult.successes : lastResult.total}
            </span>
            <span className="text-xs text-gray-600">(actual)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProbabilityChart;
