/**
 * ============================================================================
 * COMPONENT: FuzzyGauge
 * ============================================================================
 * 
 * Renderiza medidores difusos/descritivos:
 * - Ladder: Escala ordenada com seleção (Fate)
 * - Conditions: Condições marcáveis (PbtA)
 * - Feats: Lista de talentos com toggle
 * - Aspects: Aspectos invocáveis (Fate)
 * - Statuses: Estados binários
 * 
 * Design: Visual adaptativo baseado no tipo de fuzzy gauge.
 * ============================================================================
 */

import React from 'react';
import { FuzzyGauge, FuzzyGaugeType } from '../types';
import { useSheetStore } from '../store';

interface FuzzyGaugeProps {
  fuzzyGauge: FuzzyGauge;
}

const typeIcons: Record<FuzzyGaugeType, string> = {
  ladder: '📊',
  conditions: '⚠️',
  feats: '✨',
  aspects: '🔮',
  statuses: '🔄',
  custom: '⚙️',
};

const typeLabels: Record<FuzzyGaugeType, string> = {
  ladder: 'Ladder',
  conditions: 'Conditions',
  feats: 'Feats & Talents',
  aspects: 'Aspects',
  statuses: 'Statuses',
  custom: 'Custom',
};

const FuzzyGaugeComponent: React.FC<FuzzyGaugeProps> = ({ fuzzyGauge }) => {
  const toggleCondition = useSheetStore(state => state.toggleCondition);
  const setLadderValue = useSheetStore(state => state.setLadderValue);

  const renderLadder = () => {
    const sortedEntries = [...fuzzyGauge.entries].sort((a, b) => (a.rank || 0) - (b.rank || 0));
    
    return (
      <div className="space-y-1">
        {sortedEntries.map((entry) => {
          const isActive = fuzzyGauge.currentValue === entry.label;
          return (
            <button
              key={entry.id}
              onClick={() => setLadderValue(fuzzyGauge.id, entry.id)}
              className={`w-full text-left px-3 py-1.5 rounded transition-all duration-200 flex items-center justify-between
                ${isActive 
                  ? 'bg-gradient-to-r from-amber-600/40 to-amber-500/20 border border-amber-500/50 text-amber-200 shadow-md shadow-amber-900/20' 
                  : 'bg-gray-800/40 border border-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                }`}
            >
              <span className="text-sm font-medium">
                {isActive && '▸ '}{entry.label}
              </span>
              {entry.value !== undefined && (
                <span className={`text-xs font-mono ${isActive ? 'text-amber-400' : 'text-gray-600'}`}>
                  {entry.value > 0 ? '+' : ''}{entry.value}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderConditions = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {fuzzyGauge.entries.map((entry) => {
          const isActive = fuzzyGauge.activeConditions?.includes(entry.id) || entry.active;
          return (
            <button
              key={entry.id}
              onClick={() => toggleCondition(fuzzyGauge.id, entry.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                ${isActive
                  ? 'bg-red-600/30 border-red-500/60 text-red-200 shadow-md shadow-red-900/30 scale-105'
                  : 'bg-gray-800/50 border-gray-700/40 text-gray-400 hover:border-gray-500/60 hover:text-gray-200'
                }`}
            >
              {isActive && '⚡ '}{entry.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderFeats = () => {
    return (
      <div className="space-y-2">
        {fuzzyGauge.entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✦</span>
              <span className="text-sm font-semibold text-gray-200">{entry.label}</span>
            </div>
            {entry.description && (
              <p className="text-xs text-gray-500 mt-1 ml-5">{entry.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAspects = () => {
    return (
      <div className="space-y-2">
        {fuzzyGauge.entries.map((entry) => {
          const isActive = fuzzyGauge.activeConditions?.includes(entry.id) || entry.active;
          return (
            <button
              key={entry.id}
              onClick={() => toggleCondition(fuzzyGauge.id, entry.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 border
                ${isActive
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/20 border-purple-500/50 text-purple-200'
                  : 'bg-gray-800/30 border-gray-700/30 text-gray-400 hover:bg-gray-700/40'
                }`}
            >
              <span className="text-sm italic">"{entry.label}"</span>
              {entry.description && (
                <span className="block text-xs text-gray-500 mt-0.5 not-italic">{entry.description}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderStatuses = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {fuzzyGauge.entries.map((entry) => {
          const isActive = fuzzyGauge.activeConditions?.includes(entry.id) || entry.active;
          return (
            <button
              key={entry.id}
              onClick={() => toggleCondition(fuzzyGauge.id, entry.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border
                ${isActive
                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                  : 'bg-gray-800/40 border-gray-700/40 text-gray-500 hover:text-gray-300'
                }`}
            >
              {isActive ? '●' : '○'} {entry.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (fuzzyGauge.type) {
      case 'ladder': return renderLadder();
      case 'conditions': return renderConditions();
      case 'feats': return renderFeats();
      case 'aspects': return renderAspects();
      case 'statuses': return renderStatuses();
      default: return renderFeats(); // Fallback
    }
  };

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/30">
        <span className="text-lg">{typeIcons[fuzzyGauge.type]}</span>
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
          {fuzzyGauge.name}
        </h3>
        <span className="text-xs text-gray-600 ml-auto">{typeLabels[fuzzyGauge.type]}</span>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Description */}
      {fuzzyGauge.description && (
        <p className="text-xs text-gray-600 mt-3 italic">{fuzzyGauge.description}</p>
      )}
    </div>
  );
};

export default FuzzyGaugeComponent;
