/**
 * ============================================================================
 * COMPONENT: LookupTable
 * ============================================================================
 * 
 * Renderiza tabelas de consulta com input interativo.
 * Suporta tabelas de range, exatas, e matrizes.
 * 
 * Design: Tabela estilizada com destaque na linha selecionada
 * e campo de input para consulta.
 * ============================================================================
 */

import React, { useState } from 'react';
import { LookupTable, TableEntry } from '../types';
import { useSheetStore } from '../store';

interface LookupTableProps {
  table: LookupTable;
}

const LookupTableComponent: React.FC<LookupTableProps> = ({ table }) => {
  const performLookup = useSheetStore(state => state.performLookup);
  const lastTableLookup = useSheetStore(state => state.lastTableLookup);
  const [inputValue, setInputValue] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handleLookup = () => {
    if (!inputValue) return;
    
    const numericValue = parseInt(inputValue);
    const value = isNaN(numericValue) ? inputValue : numericValue;
    performLookup(table.id, value);
    
    // Highlight the matched entry
    if (lastTableLookup?.matchedEntry) {
      setHighlightedId(lastTableLookup.matchedEntry.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const formatKey = (key: string | number | [number, number]): string => {
    if (Array.isArray(key)) return `${key[0]}-${key[1]}`;
    return String(key);
  };

  const isRangeType = table.type === 'range';

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700/30">
        <span className="text-lg">📋</span>
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{table.name}</h3>
        <span className="text-xs text-gray-600 ml-auto capitalize">{table.type}</span>
      </div>

      {/* Input for lookup */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type={isRangeType ? 'number' : 'text'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRangeType ? 'Enter value (e.g., 15)' : 'Enter key...'}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700/50 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
        />
        <button
          onClick={handleLookup}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-amber-900/20"
        >
          Lookup
        </button>
      </div>

      {/* Last result */}
      {lastTableLookup && lastTableLookup.tableId === table.id && (
        <div className={`mb-4 p-3 rounded-lg border transition-all duration-300 ${
          lastTableLookup.defaultUsed 
            ? 'bg-yellow-900/20 border-yellow-700/30' 
            : 'bg-emerald-900/20 border-emerald-700/30'
        }`}>
          <p className="text-xs text-gray-400 mb-1">
            Input: <span className="text-amber-400 font-mono">{lastTableLookup.inputValue}</span>
            {lastTableLookup.defaultUsed && <span className="text-yellow-400 ml-2">(default)</span>}
          </p>
          {lastTableLookup.matchedEntry && (
            <p className="text-sm text-gray-200 font-medium">{lastTableLookup.matchedEntry.result}</p>
          )}
          {lastTableLookup.matchedEntry?.effects && lastTableLookup.matchedEntry.effects.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {lastTableLookup.matchedEntry.effects.map((effect, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
                  {effect.type}: {effect.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-700/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/80">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                {isRangeType ? 'Range' : 'Key'}
              </th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {table.entries.map((entry: TableEntry) => {
              const isHighlighted = highlightedId === entry.id || 
                (lastTableLookup?.matchedEntry?.id === entry.id);
              
              return (
                <tr
                  key={entry.id}
                  className={`border-t border-gray-700/20 transition-colors duration-200 cursor-pointer hover:bg-gray-800/50 ${
                    isHighlighted ? 'bg-amber-900/20 border-l-2 border-l-amber-500' : ''
                  }`}
                  onClick={() => {
                    setHighlightedId(entry.id);
                    setInputValue(formatKey(entry.key));
                  }}
                >
                  <td className="px-3 py-2">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                      isHighlighted ? 'bg-amber-600/30 text-amber-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {formatKey(entry.key)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{entry.result}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Description */}
      {table.description && (
        <p className="text-xs text-gray-600 mt-3 italic">{table.description}</p>
      )}
    </div>
  );
};

export default LookupTableComponent;
