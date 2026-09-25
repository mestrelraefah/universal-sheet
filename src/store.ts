/**
 * ============================================================================
 * RPG SHEET ENGINE - ZUSTAND STORE
 * ============================================================================
 * 
 * Gerenciamento de estado reativo usando Zustand.
 * Separa a lógica de estado da UI, permitindo que qualquer componente
 * reaja a mudanças na ficha.
 * ============================================================================
 */

import { create } from 'zustand';
import {
  UniversalCharacterSheet,
  Gauge,
  RollResult,
  CardDrawResult,
  TableLookupResult,
  ContestResult,
  DieRollConfig,
  CardDeck,
  LookupTable,
  Contest,
  TriggerNode,
} from './types';
import {
  resolveDieRoll,
  updateGauge,
  drawCard,
  lookupTable,
  resolveContest,
  evaluateTriggers,
  getGaugePercentage,
} from './engine';

interface SheetStore {
  // Estado principal
  sheet: UniversalCharacterSheet | null;
  
  // Resultados das últimas ações
  lastRollResult: RollResult | null;
  lastCardDraw: CardDrawResult | null;
  lastTableLookup: TableLookupResult | null;
  lastContestResult: ContestResult | null;
  
  // Log de ações
  actionLog: string[];
  
  // Triggers ativos (avaliados após cada ação)
  activeTriggers: TriggerNode[];
  
  // Ações
  loadSheet: (sheet: UniversalCharacterSheet) => void;
  
  // Gauge actions
  modifyGauge: (gaugeId: string, delta: number) => void;
  setGaugeValue: (gaugeId: string, value: number) => void;
  getGaugePercent: (gaugeId: string) => number;
  
  // Die roll actions
  performRoll: (rollConfigId: string) => void;
  
  // Card actions
  drawFromDeck: (deckId: string) => void;
  
  // Table actions
  performLookup: (tableId: string, value: string | number) => void;
  
  // Contest actions
  performContest: (contestId: string, rollResults: Map<string, RollResult>) => void;
  
  // Fuzzy gauge actions
  toggleCondition: (fuzzyId: string, entryId: string) => void;
  setLadderValue: (fuzzyId: string, entryId: string) => void;
  
  // Utility
  clearLog: () => void;
  exportSheet: () => string;
}

export const useSheetStore = create<SheetStore>((set, get) => ({
  sheet: null,
  lastRollResult: null,
  lastCardDraw: null,
  lastTableLookup: null,
  lastContestResult: null,
  actionLog: [],
  activeTriggers: [],

  loadSheet: (sheet) => {
    set({ sheet, actionLog: [`Ficha carregada: ${sheet.meta.characterName}`] });
  },

  // ---- GAUGE ACTIONS ----
  
  modifyGauge: (gaugeId, delta) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const gaugeIndex = sheet.gauges.findIndex(g => g.id === gaugeId);
    if (gaugeIndex === -1) return;

    const gauge = sheet.gauges[gaugeIndex];
    const result = updateGauge(gauge, delta);

    const newGauges = [...sheet.gauges];
    newGauges[gaugeIndex] = { ...gauge, current: result.newValue };

    const newSheet = { ...sheet, gauges: newGauges };
    
    // Avaliar triggers
    const firedTriggers = evaluateTriggers(newSheet.triggers, newSheet);
    
    const newLog = [
      ...actionLog,
      `${gauge.name}: ${result.previousValue} → ${result.newValue} (${delta > 0 ? '+' : ''}${delta})`,
    ];

    set({
      sheet: newSheet,
      activeTriggers: firedTriggers,
      actionLog: newLog,
    });
  },

  setGaugeValue: (gaugeId, value) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const gaugeIndex = sheet.gauges.findIndex(g => g.id === gaugeId);
    if (gaugeIndex === -1) return;

    const gauge = sheet.gauges[gaugeIndex];
    const clampedValue = Math.max(gauge.min, Math.min(gauge.max, value));

    const newGauges = [...sheet.gauges];
    newGauges[gaugeIndex] = { ...gauge, current: clampedValue };
    const newSheet = { ...sheet, gauges: newGauges };

    const firedTriggers = evaluateTriggers(newSheet.triggers, newSheet);

    set({
      sheet: newSheet,
      activeTriggers: firedTriggers,
      actionLog: [...actionLog, `${gauge.name} set to ${clampedValue}`],
    });
  },

  getGaugePercent: (gaugeId) => {
    const { sheet } = get();
    if (!sheet) return 0;
    const gauge = sheet.gauges.find(g => g.id === gaugeId);
    if (!gauge) return 0;
    return getGaugePercentage(gauge);
  },

  // ---- DIE ROLL ACTIONS ----

  performRoll: (rollConfigId) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const rollConfig = sheet.dieRolls.find(r => r.id === rollConfigId);
    if (!rollConfig) return;

    const result = resolveDieRoll(rollConfig);
    
    set({
      lastRollResult: result,
      actionLog: [...actionLog, `🎲 ${rollConfig.name}: ${result.rawExpression} → ${result.isSuccess ? '✓' : '✗'}`],
    });
  },

  // ---- CARD ACTIONS ----

  drawFromDeck: (deckId) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const deckIndex = sheet.decks.findIndex(d => d.id === deckId);
    if (deckIndex === -1) return;

    const deck = sheet.decks[deckIndex];
    const result = drawCard(deck);

    // Atualizar estado do deck
    const newDecks = [...sheet.decks];
    const newDrawPile = deck.drawPile.slice(0, -1);
    const newDiscardPile = [...deck.discardPile, result.card.id];
    
    newDecks[deckIndex] = {
      ...deck,
      drawPile: result.shouldReshuffle ? newDrawPile : newDrawPile,
      discardPile: newDiscardPile,
      hand: [...deck.hand, result.card.id],
    };

    set({
      sheet: { ...sheet, decks: newDecks },
      lastCardDraw: result,
      actionLog: [...actionLog, `🃏 Drew "${result.card.name}" from ${deck.name}`],
    });
  },

  // ---- TABLE ACTIONS ----

  performLookup: (tableId, value) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const table = sheet.lookupTables.find(t => t.id === tableId);
    if (!table) return;

    const result = lookupTable(table, value);

    set({
      lastTableLookup: result,
      actionLog: [...actionLog, `📋 ${table.name}[${value}] → ${result.matchedEntry?.result || 'No match'}`],
    });
  },

  // ---- CONTEST ACTIONS ----

  performContest: (contestId, rollResults) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const contest = sheet.contests.find(c => c.id === contestId);
    if (!contest) return;

    const result = resolveContest(contest, rollResults);

    set({
      lastContestResult: result,
      actionLog: [...actionLog, `⚔️ Contest "${contest.name}": ${result.resolution.outcome}`],
    });
  },

  // ---- FUZZY GAUGE ACTIONS ----

  toggleCondition: (fuzzyId, entryId) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const fuzzyIndex = sheet.fuzzyGauges.findIndex(f => f.id === fuzzyId);
    if (fuzzyIndex === -1) return;

    const fuzzy = sheet.fuzzyGauges[fuzzyIndex];
    const currentConditions = fuzzy.activeConditions || [];
    const isActive = currentConditions.includes(entryId);
    
    const newConditions = isActive
      ? currentConditions.filter(c => c !== entryId)
      : [...currentConditions, entryId];

    const newFuzzyGauges = [...sheet.fuzzyGauges];
    newFuzzyGauges[fuzzyIndex] = { ...fuzzy, activeConditions: newConditions };

    const entry = fuzzy.entries.find(e => e.id === entryId);
    set({
      sheet: { ...sheet, fuzzyGauges: newFuzzyGauges },
      actionLog: [...actionLog, `${fuzzy.name}: "${entry?.label}" ${isActive ? 'removed' : 'activated'}`],
    });
  },

  setLadderValue: (fuzzyId, entryId) => {
    const { sheet, actionLog } = get();
    if (!sheet) return;

    const fuzzyIndex = sheet.fuzzyGauges.findIndex(f => f.id === fuzzyId);
    if (fuzzyIndex === -1) return;

    const fuzzy = sheet.fuzzyGauges[fuzzyIndex];
    const entry = fuzzy.entries.find(e => e.id === entryId);
    if (!entry) return;

    const newFuzzyGauges = [...sheet.fuzzyGauges];
    newFuzzyGauges[fuzzyIndex] = { ...fuzzy, currentValue: entry.label };

    set({
      sheet: { ...sheet, fuzzyGauges: newFuzzyGauges },
      actionLog: [...actionLog, `${fuzzy.name} → "${entry.label}"`],
    });
  },

  // ---- UTILITY ----

  clearLog: () => set({ actionLog: [] }),

  exportSheet: () => {
    const { sheet } = get();
    if (!sheet) return '{}';
    return JSON.stringify(sheet, null, 2);
  },
}));
