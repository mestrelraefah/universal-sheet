/**
 * ============================================================================
 * RPG SHEET ENGINE & CONVERTER - Main Application
 * ============================================================================
 * 
 * Interface principal que demonstra o Universal Data Model em ação.
 * Permite alternar entre fichas de diferentes sistemas e visualizar
 * como os Core Design Patterns são renderizados.
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useSheetStore } from './store';
import { vampireMockSheet, dnd5eQuickRef } from './mockData';
import LinearGauge from './components/LinearGauge';
import FuzzyGaugeComponent from './components/FuzzyGauge';
import CardHand from './components/CardHand';
import LookupTableComponent from './components/LookupTable';
import ProbabilityChart from './components/ProbabilityChart';
import { UniversalCharacterSheet } from './types';
import { createStandardDeck } from './engine';
import { analyzeDiceRoll, getProbabilityColor } from './probability';

type TabId = 'gauges' | 'skills' | 'rolls' | 'fuzzy' | 'cards' | 'tables' | 'triggers' | 'log';

function App() {
  const loadSheet = useSheetStore(state => state.loadSheet);
  const sheet = useSheetStore(state => state.sheet);
  const actionLog = useSheetStore(state => state.actionLog);
  const lastRollResult = useSheetStore(state => state.lastRollResult);
  const performRoll = useSheetStore(state => state.performRoll);
  const activeTriggers = useSheetStore(state => state.activeTriggers);
  
  const [activeTab, setActiveTab] = useState<TabId>('gauges');
  const [activeSystem, setActiveSystem] = useState<'vampire' | 'dnd'>('vampire');

  useEffect(() => {
    if (activeSystem === 'vampire') {
      loadSheet(vampireMockSheet);
    } else {
      // Create a complete D&D sheet from the partial
      const dndSheet: UniversalCharacterSheet = {
        meta: dnd5eQuickRef.meta!,
        gauges: dnd5eQuickRef.gauges || [],
        dieRolls: dnd5eQuickRef.dieRolls || [],
        decks: [createStandardDeck('deck-initiative', 'Initiative Deck')],
        fuzzyGauges: dnd5eQuickRef.fuzzyGauges || [],
        lookupTables: dnd5eQuickRef.lookupTables || [],
        contests: [],
        triggers: dnd5eQuickRef.triggers || [],
      };
      loadSheet(dndSheet);
    }
  }, [activeSystem, loadSheet]);

  if (!sheet) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>;

  const tabs: { id: TabId; label: string; icon: string; count?: number }[] = [
    { id: 'gauges', label: 'Attributes', icon: '📊', count: sheet.gauges.filter(g => g.category === 'stat').length },
    { id: 'skills', label: 'Resources', icon: '❤️', count: sheet.gauges.filter(g => g.category !== 'stat').length },
    { id: 'rolls', label: 'Dice Rolls', icon: '🎲', count: sheet.dieRolls.length },
    { id: 'fuzzy', label: 'Powers', icon: '✨', count: sheet.fuzzyGauges.length },
    { id: 'cards', label: 'Cards', icon: '🃏', count: sheet.decks.length },
    { id: 'tables', label: 'Tables', icon: '📋', count: sheet.lookupTables.length },
    { id: 'triggers', label: 'Triggers', icon: '⚡', count: sheet.triggers.length },
    { id: 'log', label: 'Log', icon: '📜' },
  ];

  const statGauges = sheet.gauges.filter(g => g.category === 'stat');
  const resourceGauges = sheet.gauges.filter(g => g.category !== 'stat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-purple-900/30">
                ⚔️
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">RPG Sheet Engine</h1>
                <p className="text-xs text-gray-500">Universal Data Model • Phase 1</p>
              </div>
            </div>
            
            {/* System Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSystem('vampire')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSystem === 'vampire'
                    ? 'bg-red-600/20 text-red-300 border border-red-600/50'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700/30 hover:text-gray-300'
                }`}
              >
                🧛 VtM 5e
              </button>
              <button
                onClick={() => setActiveSystem('dnd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSystem === 'dnd'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-600/50'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700/30 hover:text-gray-300'
                }`}
              >
                🐉 D&D 5e
              </button>
            </div>
          </div>

          {/* Character Info */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-white font-semibold">{sheet.meta.characterName}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">{sheet.meta.systemName}</span>
            {sheet.meta.customFields?.clan !== undefined && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-purple-400">Clan {String(sheet.meta.customFields.clan)}</span>
              </>
            )}
            {sheet.meta.customFields?.concept !== undefined && (
              <span className="text-gray-500 italic">"{String(sheet.meta.customFields.concept)}"</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-48 shrink-0">
            <div className="sticky top-28 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Last Roll Result Banner - Compact */}
            {lastRollResult && (
              <div className={`mb-4 px-4 py-2 rounded-lg border transition-all flex items-center justify-between ${
                lastRollResult.isSuccess
                  ? 'bg-emerald-900/10 border-emerald-700/20'
                  : 'bg-red-900/10 border-red-700/20'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lastRollResult.isSuccess ? '✅' : '❌'}</span>
                  <div>
                    <p className="text-xs text-gray-400">Last Roll: <span className="text-gray-300 font-mono">{lastRollResult.rawExpression}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lastRollResult.successes !== undefined && (
                    <span className={`text-sm font-bold ${lastRollResult.successes > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {lastRollResult.successes} successes
                    </span>
                  )}
                  <span className={`text-xl font-bold ${lastRollResult.isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                    {lastRollResult.total}
                  </span>
                </div>
              </div>
            )}

            {/* Active Triggers Warning */}
            {activeTriggers.length > 0 && (
              <div className="mb-6 p-4 rounded-xl border border-yellow-700/30 bg-yellow-900/10">
                <p className="text-xs text-yellow-400 font-semibold mb-2">⚡ Active Triggers</p>
                {activeTriggers.map(trigger => (
                  <div key={trigger.id} className="flex items-center gap-2 text-sm text-yellow-200/70">
                    <span>→</span>
                    <span>{trigger.name}: {trigger.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'gauges' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📊 Attributes
                  <span className="text-xs text-gray-500 font-normal">
                    ({sheet.meta.systemName} - Primary Attributes)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statGauges.map(gauge => (
                    <LinearGauge key={gauge.id} gauge={gauge} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  ❤️ Resources & Skills
                  <span className="text-xs text-gray-500 font-normal">
                    (Health, Willpower, Skills, Rank)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resourceGauges.map(gauge => (
                    <LinearGauge key={gauge.id} gauge={gauge} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rolls' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📈 Probability Analysis
                    <span className="text-xs text-gray-500 font-normal">
                      (Statistical odds before rolling)
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      {sheet.dieRolls.length} dice pools analyzed
                    </span>
                  </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {sheet.dieRolls.slice(0, 4).map(roll => {
                    const analysis = analyzeDiceRoll(roll);
                    const prob = analysis.successAnalysis.successProbability;
                    const color = getProbabilityColor(prob);
                    return (
                      <div key={roll.id} className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <p className="text-xs text-gray-500 truncate">{roll.name}</p>
                        <p className="text-lg font-bold mt-1" style={{ color }}>
                          {(prob * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600">
                          {roll.dice.map(d => `${d.count}${d.type}`).join('+')}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sheet.dieRolls.map(roll => (
                    <ProbabilityChart
                      key={roll.id}
                      rollConfig={roll}
                      onRoll={() => performRoll(roll.id)}
                      lastResult={lastRollResult?.rollId === roll.id ? {
                        total: lastRollResult.total,
                        isSuccess: lastRollResult.isSuccess,
                        successes: lastRollResult.successes,
                        rawExpression: lastRollResult.rawExpression,
                      } : null}
                    />
                  ))}
                </div>

                {/* Comparison Matrix */}
                {sheet.dieRolls.length > 1 && (
                  <div className="mt-6 rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
                    <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                      📊 Comparative Overview
                    </h3>
                    <div className="space-y-3">
                      {sheet.dieRolls.map(roll => {
                        const analysis = analyzeDiceRoll(roll);
                        const prob = analysis.successAnalysis.successProbability;
                        const color = getProbabilityColor(prob);
                        return (
                          <div key={roll.id} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-36 truncate">{roll.name}</span>
                            <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden relative">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${prob * 100}%`, backgroundColor: color }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 w-20 text-right">
                              {roll.dice.map(d => `${d.count}${d.type}`).join('+')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fuzzy' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  ✨ Powers & Traits
                  <span className="text-xs text-gray-500 font-normal">
                    (Disciplines, Conditions, Aspects)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheet.fuzzyGauges.map(fuzzy => (
                    <FuzzyGaugeComponent key={fuzzy.id} fuzzyGauge={fuzzy} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cards' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  🃏 Card Decks
                  <span className="text-xs text-gray-500 font-normal">
                    (Draw mechanics)
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {sheet.decks.map(deck => (
                    <CardHand key={deck.id} deck={deck} />
                  ))}
                </div>
                {sheet.decks.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    No card decks configured for this system.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tables' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📋 Lookup Tables
                  <span className="text-xs text-gray-500 font-normal">
                    (Query tables by value)
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {sheet.lookupTables.map(table => (
                    <LookupTableComponent key={table.id} table={table} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'triggers' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  ⚡ Triggers & Nodes
                  <span className="text-xs text-gray-500 font-normal">
                    (Automated mechanics)
                  </span>
                </h2>
                <div className="space-y-3">
                  {sheet.triggers.map(trigger => (
                    <div
                      key={trigger.id}
                      className={`rounded-xl border p-4 transition-all ${
                        trigger.enabled
                          ? 'border-gray-700/50 bg-gray-900/50'
                          : 'border-gray-800/30 bg-gray-900/20 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${trigger.enabled ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                          <h3 className="text-sm font-bold text-gray-200">{trigger.name}</h3>
                          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                            Priority: {trigger.priority}
                          </span>
                        </div>
                      </div>
                      {trigger.description && (
                        <p className="text-xs text-gray-500 mb-3">{trigger.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-800/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1 font-semibold">WHEN:</p>
                          <p className="text-xs text-gray-300">
                            {trigger.condition.type} → {trigger.condition.targetId}
                            {trigger.condition.operator && ` ${trigger.condition.operator} ${trigger.condition.value}`}
                          </p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1 font-semibold">THEN:</p>
                          {trigger.actions.map((action, i) => (
                            <p key={i} className="text-xs text-gray-300">
                              → {action.type}: {action.targetId}
                              {action.description && ` (${action.description})`}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'log' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📜 Action Log
                </h2>
                <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 max-h-[600px] overflow-y-auto">
                  {actionLog.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-8">No actions recorded yet. Try rolling some dice!</p>
                  ) : (
                    <div className="space-y-1">
                      {actionLog.map((entry, i) => (
                        <p key={i} className="text-xs text-gray-400 font-mono py-1 border-b border-gray-800/30">
                          {entry}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-600">
            RPG Sheet Engine v1.0 • Universal Data Model • Phase 1 Implementation
          </p>
          <p className="text-xs text-gray-700 mt-1">
            7 Core Design Patterns • Pure Rule Engine • React + Zustand + Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
