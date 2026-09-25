/**
 * ============================================================================
 * COMPONENT: CardHand
 * ============================================================================
 * 
 * Renderiza um baralho de cartas com mecânicas de saque e visualização.
 * Suporta baralhos de poker, tarot, e customizados.
 * 
 * Design: Cards com perspectiva 3D, animação de saque, e
 * visualização da mão atual do jogador.
 * ============================================================================
 */

import React, { useState } from 'react';
import { CardDeck, Card } from '../types';
import { useSheetStore } from '../store';

interface CardHandProps {
  deck: CardDeck;
}

const suitSymbols: Record<string, string> = {
  'Hearts': '♥',
  'Diamonds': '♦',
  'Clubs': '♣',
  'Spades': '♠',
  'Joker': '★',
};

const suitColors: Record<string, string> = {
  'Hearts': 'text-red-500',
  'Diamonds': 'text-red-500',
  'Clubs': 'text-gray-200',
  'Spades': 'text-gray-200',
  'Joker': 'text-yellow-400',
};

const CardComponent: React.FC<{ card: Card; faceDown?: boolean; small?: boolean }> = ({ card, faceDown = false, small = false }) => {
  const symbol = suitSymbols[card.suit || ''] || '?';
  const colorClass = suitColors[card.suit || ''] || 'text-gray-400';
  
  if (faceDown) {
    return (
      <div className={`${small ? 'w-12 h-16' : 'w-20 h-28'} rounded-lg bg-gradient-to-br from-indigo-800 to-indigo-950 border-2 border-indigo-600/50 shadow-lg flex items-center justify-center`}>
        <div className="text-indigo-400/50 text-2xl">✦</div>
      </div>
    );
  }

  return (
    <div className={`${small ? 'w-12 h-16' : 'w-20 h-28'} rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 shadow-lg flex flex-col items-center justify-center relative overflow-hidden transition-transform hover:scale-110 hover:-translate-y-1 hover:shadow-xl`}>
      <span className={`${colorClass} ${small ? 'text-lg' : 'text-2xl'} font-bold`}>{symbol}</span>
      <span className={`${colorClass} ${small ? 'text-xs' : 'text-sm'} font-bold mt-1`}>{card.value}</span>
      {card.name && (
        <span className="absolute bottom-1 text-[8px] text-gray-500 truncate w-full text-center px-1">{card.name}</span>
      )}
    </div>
  );
};

const CardHand: React.FC<CardHandProps> = ({ deck }) => {
  const drawFromDeck = useSheetStore(state => state.drawFromDeck);
  const lastCardDraw = useSheetStore(state => state.lastCardDraw);
  const [showDeck, setShowDeck] = useState(false);

  const handCards = deck.hand
    .map(id => deck.cards.find(c => c.id === id))
    .filter((c): c is Card => c !== undefined);

  const remainingCards = deck.drawPile.length;
  const discardedCards = deck.discardPile.length;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🃏</span>
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{deck.name}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>📥 {remainingCards}</span>
          <span>📤 {discardedCards}</span>
          <span>🖐 {handCards.length}</span>
        </div>
      </div>

      {/* Draw Button */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => drawFromDeck(deck.id)}
          disabled={remainingCards === 0 && discardedCards === 0}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🎴 Draw Card
        </button>
        
        <button
          onClick={() => setShowDeck(!showDeck)}
          className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors border border-gray-700/50"
        >
          {showDeck ? 'Hide Deck' : 'View Deck'}
        </button>
      </div>

      {/* Last Draw Result */}
      {lastCardDraw && lastCardDraw.deckId === deck.id && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-900/20 border border-indigo-700/30 animate-fade-in">
          <p className="text-xs text-indigo-400 mb-2">Last Draw:</p>
          <div className="flex items-center gap-3">
            <CardComponent card={lastCardDraw.card} />
            <div>
              <p className="text-sm font-semibold text-gray-200">{lastCardDraw.card.name}</p>
              {lastCardDraw.shouldReshuffle && (
                <p className="text-xs text-yellow-400">🔄 Deck reshuffled!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deck Preview */}
      {showDeck && (
        <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
          <p className="text-xs text-gray-500 mb-2">Draw Pile ({remainingCards} cards):</p>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {deck.drawPile.slice(0, 20).map((cardId, i) => {
              const card = deck.cards.find(c => c.id === cardId);
              return card ? <CardComponent key={i} card={card} faceDown small /> : null;
            })}
            {remainingCards > 20 && (
              <span className="text-xs text-gray-500 self-center ml-2">+{remainingCards - 20} more</span>
            )}
          </div>
        </div>
      )}

      {/* Hand */}
      {handCards.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Hand ({handCards.length} cards):</p>
          <div className="flex flex-wrap gap-2">
            {handCards.map((card, i) => (
              <div key={card.id + i} style={{ transform: `rotate(${(i - handCards.length / 2) * 3}deg)` }}>
                <CardComponent card={card} />
              </div>
            ))}
          </div>
        </div>
      )}

      {handCards.length === 0 && (
        <div className="text-center py-6 text-gray-600 text-sm">
          No cards in hand. Draw a card to begin.
        </div>
      )}
    </div>
  );
};

export default CardHand;
