/**
 * ============================================================================
 * COMPONENT: LinearGauge
 * ============================================================================
 * 
 * Renderiza um medidor linear (barra de progresso) com controles +/-
 * e exibição do valor atual. Suporta diferentes categorias visuais.
 * 
 * Design: Tailwind CSS com gradientes e transições suaves.
 * ============================================================================
 */

import React from 'react';
import { Gauge, GaugeCategory } from '../types';
import { useSheetStore } from '../store';

interface LinearGaugeProps {
  gauge: Gauge;
  compact?: boolean;
  showControls?: boolean;
}

/**
 * Cores por categoria de gauge - mapeamento visual intuitivo
 */
const categoryColors: Record<GaugeCategory, { bar: string; bg: string; text: string; border: string }> = {
  stat:           { bar: 'from-blue-500 to-blue-600',   bg: 'bg-blue-950/30',   text: 'text-blue-300',   border: 'border-blue-700/50' },
  resource:       { bar: 'from-red-500 to-red-600',     bg: 'bg-red-950/30',    text: 'text-red-300',    border: 'border-red-700/50' },
  currency:       { bar: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-950/30', text: 'text-yellow-300', border: 'border-yellow-700/50' },
  safety_valve:   { bar: 'from-purple-500 to-purple-600', bg: 'bg-purple-950/30', text: 'text-purple-300', border: 'border-purple-700/50' },
  skill:          { bar: 'from-green-500 to-green-600', bg: 'bg-green-950/30',  text: 'text-green-300',  border: 'border-green-700/50' },
  rank:           { bar: 'from-amber-500 to-amber-600', bg: 'bg-amber-950/30',  text: 'text-amber-300',  border: 'border-amber-700/50' },
  wound:          { bar: 'from-rose-600 to-rose-700',   bg: 'bg-rose-950/30',   text: 'text-rose-300',   border: 'border-rose-700/50' },
  trauma:         { bar: 'from-gray-500 to-gray-600',   bg: 'bg-gray-950/30',   text: 'text-gray-300',   border: 'border-gray-700/50' },
  success_reward: { bar: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-950/30', text: 'text-emerald-300', border: 'border-emerald-700/50' },
  trait:          { bar: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-950/30', text: 'text-indigo-300', border: 'border-indigo-700/50' },
  custom:         { bar: 'from-slate-500 to-slate-600', bg: 'bg-slate-950/30',  text: 'text-slate-300',  border: 'border-slate-700/50' },
};

const LinearGauge: React.FC<LinearGaugeProps> = ({ gauge, compact = false, showControls = true }) => {
  const modifyGauge = useSheetStore(state => state.modifyGauge);
  const setGaugeValue = useSheetStore(state => state.setGaugeValue);
  
  const percentage = ((gauge.current - gauge.min) / (gauge.max - gauge.min)) * 100;
  const colors = categoryColors[gauge.category];
  
  const isLow = percentage <= 25;
  const isCritical = percentage <= 10;

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3 transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${colors.text} uppercase tracking-wide`}>
            {gauge.name}
          </span>
          {gauge.description && (
            <span className="text-xs text-gray-500" title={gauge.description}>ⓘ</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-lg font-bold ${isCritical ? 'text-red-400 animate-pulse' : isLow ? 'text-yellow-400' : 'text-white'}`}>
            {gauge.current}
          </span>
          <span className="text-xs text-gray-500">/ {gauge.max}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
        <div
          className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-500 ease-out ${isCritical ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
        {/* Marcadores de step */}
        {!compact && gauge.max <= 20 && (
          <div className="absolute inset-0 flex">
            {Array.from({ length: gauge.max - gauge.min }, (_, i) => (
              <div
                key={i}
                className={`flex-1 border-r border-gray-700/30 ${i < (gauge.current - gauge.min) ? 'bg-white/5' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controles */}
      {showControls && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => modifyGauge(gauge.id, -1)}
              className="w-7 h-7 rounded bg-gray-700 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center"
              disabled={gauge.current <= gauge.min}
            >
              −
            </button>
            <button
              onClick={() => modifyGauge(gauge.id, 1)}
              className="w-7 h-7 rounded bg-gray-700 hover:bg-green-600 text-white text-sm font-bold transition-colors flex items-center justify-center"
              disabled={gauge.current >= gauge.max}
            >
              +
            </button>
          </div>
          <span className="text-xs text-gray-500">
            Step: {gauge.step} | Range: [{gauge.min}, {gauge.max}]
          </span>
        </div>
      )}

      {/* Input direto para valores grandes */}
      {!compact && gauge.max > 20 && (
        <div className="mt-2">
          <input
            type="range"
            min={gauge.min}
            max={gauge.max}
            value={gauge.current}
            onChange={(e) => setGaugeValue(gauge.id, parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}
    </div>
  );
};

export default LinearGauge;
