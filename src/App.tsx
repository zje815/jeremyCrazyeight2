/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Diamond, 
  Club, 
  Spade, 
  RotateCcw, 
  Trophy, 
  User, 
  Cpu,
  Info,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types & Constants ---

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const RANK_VALUES: Record<Rank, number> = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

// --- Helper Functions ---

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: RANK_VALUES[rank]
      });
    });
  });
  return deck;
};

const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// --- Components ---

const SuitIcon = ({ suit, className = "" }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'hearts': return <Heart className={`text-red-500 fill-red-500 ${className}`} size={20} />;
    case 'diamonds': return <Diamond className={`text-red-500 fill-red-500 ${className}`} size={20} />;
    case 'clubs': return <Club className={`text-slate-900 fill-slate-900 ${className}`} size={20} />;
    case 'spades': return <Spade className={`text-slate-900 fill-slate-900 ${className}`} size={20} />;
  }
};

const PlayingCard: React.FC<{ 
  card: Card; 
  isFaceUp?: boolean; 
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = ""
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -50 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg shadow-lg border-2 
        flex flex-col items-center justify-center cursor-pointer select-none
        ${isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-700 border-indigo-900'}
        ${isPlayable ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
        ${className}
      `}
    >
      {isFaceUp ? (
        <>
          <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
            <span className={`text-xs sm:text-sm font-bold ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-slate-900'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          
          <div className="flex items-center justify-center">
            <SuitIcon suit={card.suit} className="w-8 h-8 sm:w-12 sm:h-12 opacity-80" />
          </div>

          <div className="absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180">
            <span className={`text-xs sm:text-sm font-bold ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-slate-900'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full border-2 border-indigo-400/30 rounded-md flex items-center justify-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-4 border-indigo-400/20 flex items-center justify-center">
              <span className="text-indigo-300/50 font-bold text-xl italic">T</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'choosing_suit' | 'won' | 'lost'>('start');
  const [message, setMessage] = useState("欢迎来到疯狂 8 点！");

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const pHand = fullDeck.splice(0, 8);
    const aHand = fullDeck.splice(0, 8);
    
    // Initial discard cannot be an 8 for simplicity in this version
    let firstDiscardIndex = 0;
    while (fullDeck[firstDiscardIndex].rank === '8') {
      firstDiscardIndex++;
    }
    const firstDiscard = fullDeck.splice(firstDiscardIndex, 1)[0];

    setDeck(fullDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setTurn('player');
    setGameState('playing');
    setMessage("轮到你了！请匹配花色或点数。");
  }, []);

  const topDiscard = discardPile[discardPile.length - 1];

  const canPlayCard = useCallback((card: Card) => {
    if (!topDiscard) return false;
    if (card.rank === '8') return true;
    return card.suit === currentSuit || card.rank === topDiscard.rank;
  }, [topDiscard, currentSuit]);

  const checkWin = useCallback((hand: Card[], isPlayer: boolean) => {
    if (hand.length === 0) {
      if (isPlayer) {
        setGameState('won');
        setMessage("恭喜！你赢了！");
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setGameState('lost');
        setMessage("AI 赢了！下次好运。");
      }
      return true;
    }
    return false;
  }, []);

  const handlePlayCard = (card: Card, isPlayer: boolean) => {
    if (gameState !== 'playing') return;
    
    const hand = isPlayer ? playerHand : aiHand;
    const setHand = isPlayer ? setPlayerHand : setAiHand;
    
    const newHand = hand.filter(c => c.id !== card.id);
    setHand(newHand);
    setDiscardPile(prev => [...prev, card]);
    
    if (checkWin(newHand, isPlayer)) return;

    if (card.rank === '8') {
      if (isPlayer) {
        setGameState('choosing_suit');
        setMessage("疯狂 8 点！请选择一个新花色。");
      } else {
        // AI chooses suit (the one it has most of)
        const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
        newHand.forEach(c => suitCounts[c.suit]++);
        const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
        setCurrentSuit(bestSuit);
        const suitNames: Record<Suit, string> = { hearts: '红心', diamonds: '方块', clubs: '梅花', spades: '黑桃' };
        setMessage(`AI 出了 8 并选择了 ${suitNames[bestSuit]}！`);
        setTurn('player');
      }
    } else {
      setCurrentSuit(card.suit);
      setTurn(isPlayer ? 'ai' : 'player');
      setMessage(isPlayer ? "AI 正在思考..." : "轮到你了！");
    }
  };

  const handleDrawCard = (isPlayer: boolean) => {
    if (gameState !== 'playing') return;
    if (deck.length === 0) {
      setMessage("牌堆已空！跳过回合。");
      setTurn(isPlayer ? 'ai' : 'player');
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.pop()!;
    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand(prev => [...prev, drawnCard]);
      // Check if drawn card can be played immediately
      if (!canPlayCard(drawnCard)) {
        setMessage("你摸了一张牌。没有可出的牌，轮到 AI。");
        setTurn('ai');
      } else {
        setMessage("你摸了一张牌。你可以立即出这张牌！");
      }
    } else {
      setAiHand(prev => [...prev, drawnCard]);
      if (!canPlayCard(drawnCard)) {
        setMessage("AI 摸了一张牌但无法出牌。轮到你了！");
        setTurn('player');
      } else {
        // AI plays the drawn card
        setTimeout(() => handlePlayCard(drawnCard, false), 1000);
      }
    }
  };

  const handleSuitSelection = (suit: Suit) => {
    setCurrentSuit(suit);
    setGameState('playing');
    setTurn('ai');
    const suitNames: Record<Suit, string> = { hearts: '红心', diamonds: '方块', clubs: '梅花', spades: '黑桃' };
    setMessage(`你选择了 ${suitNames[suit]}。轮到 AI 了。`);
  };

  // AI Logic
  useEffect(() => {
    if (turn === 'ai' && gameState === 'playing') {
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(canPlayCard);
        if (playableCards.length > 0) {
          // AI Strategy: Play non-8s first, then 8s
          const nonEight = playableCards.find(c => c.rank !== '8');
          handlePlayCard(nonEight || playableCards[0], false);
        } else {
          handleDrawCard(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, gameState, aiHand, canPlayCard]);

  const hasValidMoves = useMemo(() => {
    return playerHand.some(canPlayCard);
  }, [playerHand, canPlayCard]);

  return (
    <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-700 p-4 sm:p-8 flex flex-col items-center overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <RotateCcw className="text-emerald-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Jeremy 的疯狂 8 点</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-full border border-white/10">
          <div className="flex items-center gap-2">
            <User size={18} className={turn === 'player' ? 'text-yellow-400' : 'text-white/40'} />
            <span className={`text-sm font-medium ${turn === 'player' ? 'text-yellow-400' : 'text-white/40'}`}>
              玩家: {playerHand.length}
            </span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Cpu size={18} className={turn === 'ai' ? 'text-yellow-400' : 'text-white/40'} />
            <span className={`text-sm font-medium ${turn === 'ai' ? 'text-yellow-400' : 'text-white/40'}`}>
              AI: {aiHand.length}
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 w-full max-w-5xl flex flex-col gap-8 relative">
        
        {/* AI Hand */}
        <div className="flex justify-center h-32 sm:h-40">
          <div className="flex -space-x-12 sm:-space-x-16 hover:-space-x-8 transition-all duration-300">
            <AnimatePresence>
              {aiHand.map((card, idx) => (
                <PlayingCard key={card.id} card={card} isFaceUp={false} className="z-0" />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Table */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
          <div className="flex items-center gap-12 sm:gap-20">
            {/* Draw Pile */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-white/5 rounded-xl blur-xl group-hover:bg-white/10 transition-colors" />
              <div className="relative">
                <PlayingCard 
                  card={{} as Card} 
                  isFaceUp={false} 
                  onClick={() => turn === 'player' && !hasValidMoves && handleDrawCard(true)}
                  isPlayable={turn === 'player' && !hasValidMoves && gameState === 'playing'}
                  className="shadow-2xl"
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-emerald-300/60 font-bold whitespace-nowrap">
                  摸牌堆 ({deck.length})
                </div>
              </div>
            </div>

            {/* Discard Pile */}
            <div className="relative">
              <div className="absolute -inset-8 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  {topDiscard && (
                    <PlayingCard 
                      key={topDiscard.id}
                      card={topDiscard} 
                      className="shadow-2xl ring-2 ring-white/20"
                    />
                  )}
                </AnimatePresence>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-emerald-300/60 font-bold whitespace-nowrap">
                  弃牌堆
                </div>
                
                {/* Current Suit Indicator */}
                {currentSuit && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg border-2 border-emerald-800 z-10"
                  >
                    <SuitIcon suit={currentSuit} className="w-5 h-5" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          <motion.div 
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center max-w-md"
          >
            <p className="text-sm sm:text-base font-medium text-emerald-50">{message}</p>
          </motion.div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center flex-wrap gap-2 sm:gap-4 px-4 max-w-full">
            <AnimatePresence>
              {playerHand.map((card) => (
                <PlayingCard 
                  key={card.id} 
                  card={card} 
                  isPlayable={turn === 'player' && canPlayCard(card) && gameState === 'playing'}
                  onClick={() => handlePlayCard(card, true)}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {turn === 'player' && !hasValidMoves && gameState === 'playing' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleDrawCard(true)}
              className="flex items-center gap-2 bg-yellow-400 text-emerald-950 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-yellow-300 transition-colors"
            >
              无牌可出？摸一张牌 <ChevronRight size={18} />
            </motion.button>
          )}
        </div>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-md p-6"
          >
            <div className="bg-emerald-800 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full text-center">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4">疯狂 8 点</h2>
              <p className="text-emerald-200 mb-8 leading-relaxed">
                匹配顶牌的点数或花色。8 是万能牌！最先清空手牌的人获胜。
              </p>
              <button 
                onClick={initGame}
                className="w-full bg-yellow-400 text-emerald-950 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-yellow-300 transition-all active:scale-95"
              >
                开始游戏
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'choosing_suit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
              <h2 className="text-slate-900 text-2xl font-bold mb-6 text-center">选择一个新花色</h2>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => {
                  const suitNames: Record<Suit, string> = { hearts: '红心', diamonds: '方块', clubs: '梅花', spades: '黑桃' };
                  return (
                    <button
                      key={suit}
                      onClick={() => handleSuitSelection(suit)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                      <SuitIcon suit={suit} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      <span className="text-slate-600 font-bold capitalize">{suitNames[suit]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <div className="bg-emerald-800 p-10 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full text-center">
              <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className={`w-12 h-12 ${gameState === 'won' ? 'text-yellow-400' : 'text-slate-400'}`} />
              </div>
              <h2 className="text-4xl font-bold mb-2">{gameState === 'won' ? '胜利！' : '游戏结束'}</h2>
              <p className="text-emerald-200 mb-10 text-lg">
                {gameState === 'won' ? '你最先清空了手牌！' : '这次 AI 赢了。'}
              </p>
              <button 
                onClick={initGame}
                className="w-full bg-white text-emerald-900 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
              >
                再玩一次
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-8 text-emerald-400/50 flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
        <Info size={14} />
        标准 52 张扑克牌 • 疯狂 8 点规则
      </footer>
    </div>
  );
}
