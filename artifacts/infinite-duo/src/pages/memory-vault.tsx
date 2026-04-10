import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/lib/store";

// All truth questions from Truth or Dare — used as the question bank
const QUESTION_BANK = [
  "What is your favorite memory of us?",
  "What's a habit of mine you find endearing?",
  "When did you first know you loved me?",
  "What's something you've always wanted to try together?",
  "What's the most attractive quality about me?",
  "What's a small thing I do that makes you smile?",
  "What's one thing you wish we did more often?",
  "What's a secret talent you have?",
  "What's your favorite way to spend a lazy Sunday with me?",
  "What's the best advice you've ever received about relationships?",
  "What's a dream you've never told anyone?",
  "What's the kindest thing I've ever done for you?",
  "What's your love language and do I speak it well?",
  "What's something you want to experience with me before we're old?",
  "What's the most romantic thing I've ever done for you?",
  "What's your ideal date night?",
  "What song makes you think of us?",
  "What's a promise you want to make to me?",
  "Where would you want to go for our dream vacation?",
  "What's your favorite thing about being with me?",
  "When do you feel most loved by me?",
  "What's a small gesture that means a lot to you?",
  "What's a memory that still gives you butterflies?",
  "What's one thing you'd like us to do every year?",
  "What's the moment you knew I was different?",
  "What's a romantic cliché you secretly want us to do?",
  "What's your favorite pickup line?",
  "What's something I do that's a total turn-on?",
  "What's your signature move when flirting?",
  "What part of my personality do you find sexy?",
  "What's something you find cute when I do it?",
  "What's a physical feature of mine you can't resist?",
  "What's something I do without realizing that drives you wild?",
  "When was the last time I made your heart skip?",
  "What's the funniest thing that ever happened to us?",
  "What's the most embarrassing thing you've done in public?",
  "What's a ridiculous fear you have?",
  "What's the funniest autocorrect fail you've had?",
  "What's a weird food combination you enjoy?",
  "What's the most bizarre dream you've had about me?",
  "What would your villain name be and what's your evil plan?",
  "What animal do I remind you of and why?",
  "What's a nickname you secretly gave me in your head?",
  "What was your favorite childhood TV show?",
  "What's the silliest thing you believed as a kid?",
  "What's a game you loved playing as a child?",
  "What's a funny childhood memory?",
  "What's a toy you wished you still had?",
  "What's a cartoon character you had a crush on?",
  "What's a silly fear you had growing up?",
  "What did you want to be when you grew up?",
  "What's a song that takes you straight back to childhood?",
  "What's a fantasy you've never told me about?",
  "What turns you on that I might not realize?",
  "Have you ever had a dream about me that was spicy?",
  "When do you feel most attracted to me?",
  "What's a secret desire you're shy to admit?",
  "What song would be on your 'mood' playlist?",
  "What's something you want to ask me but haven't dared?",
  "What's a roleplay scenario you'd enjoy?",
  "What's the naughtiest thought you've had today?",
  "What's something you find irresistibly attractive that most people wouldn't expect?",
  "What would the title of a steamy book about us be?",
];

const MEMORIES = [
  { emoji: "🌅", title: "Sunrise Together", hint: "A morning neither of you will forget" },
  { emoji: "🍕", title: "Late Night Cravings", hint: "That time hunger struck at the worst moment" },
  { emoji: "🎵", title: "Our Song", hint: "The one that plays and stops time" },
  { emoji: "🌧️", title: "Caught in the Rain", hint: "When the weather had other plans" },
  { emoji: "🏠", title: "Home Feeling", hint: "The moment a place became home" },
  { emoji: "🌟", title: "Best Night Ever", hint: "You both know exactly which one" },
];

type GamePhase = "player1-puzzle" | "player2-answer" | "complete";
const SIZE = 3;

function initTiles(): number[][] {
  let val = 1;
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => {
      if (r === SIZE - 1 && c === SIZE - 1) return 0;
      return val++;
    })
  );
}

function shuffleTiles(tiles: number[][], emptyPos: { row: number; col: number }, steps = 40) {
  const t = tiles.map(r => [...r]);
  let ep = { ...emptyPos };
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let s = 0; s < steps; s++) {
    const valid = dirs.filter(([dr, dc]) => {
      const nr = ep.row + dr, nc = ep.col + dc;
      return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE;
    });
    const [dr, dc] = valid[Math.floor(Math.random() * valid.length)];
    const sr = ep.row + dr, sc = ep.col + dc;
    t[ep.row][ep.col] = t[sr][sc];
    t[sr][sc] = 0;
    ep = { row: sr, col: sc };
  }
  return { tiles: t, emptyPos: ep };
}

function checkWin(tiles: number[][]): boolean {
  let val = 1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (r === SIZE - 1 && c === SIZE - 1) return tiles[r][c] === 0;
      if (tiles[r][c] !== val++) return false;
    }
  }
  return true;
}

function getRandomQuestion(usedIdx: Set<number>): { question: string; idx: number } {
  const available = QUESTION_BANK.map((_, i) => i).filter(i => !usedIdx.has(i));
  if (available.length === 0) return { question: QUESTION_BANK[0], idx: 0 };
  const idx = available[Math.floor(Math.random() * available.length)];
  return { question: QUESTION_BANK[idx], idx };
}

export default function MemoryVault() {
  const [, navigate] = useLocation();
  const { player1Id, player2Id } = usePlayerStore();

  const [memoryIdx, setMemoryIdx] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("player1-puzzle");
  const [tiles, setTiles] = useState<number[][]>(() => {
    const init = initTiles();
    const { tiles: shuffled } = shuffleTiles(init, { row: SIZE - 1, col: SIZE - 1 }, 35);
    return shuffled;
  });
  const [emptyPos, setEmptyPos] = useState<{ row: number; col: number }>(() => {
    const init = initTiles();
    const { emptyPos: ep } = shuffleTiles(init, { row: SIZE - 1, col: SIZE - 1 }, 35);
    return ep;
  });

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQIdx, setCurrentQIdx] = useState(-1);
  const [usedQIdxs, setUsedQIdxs] = useState(new Set<number>());
  const [answer, setAnswer] = useState("");
  const [savedAnswers, setSavedAnswers] = useState<Array<{ memory: string; question: string; answer: string }>>([]);
  const [answerSaved, setAnswerSaved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const doShuffle = useCallback(() => {
    const freshTiles = initTiles();
    const { tiles: s, emptyPos: ep } = shuffleTiles(freshTiles, { row: SIZE - 1, col: SIZE - 1 }, 40);
    setTiles(s);
    setEmptyPos(ep);
    setMoves(0);
    setWon(false);
  }, []);

  const handleTileClick = (row: number, col: number) => {
    if (phase !== "player1-puzzle" || won) return;
    const dr = Math.abs(emptyPos.row - row);
    const dc = Math.abs(emptyPos.col - col);
    if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) return;
    if (navigator.vibrate) navigator.vibrate(15);
    const newTiles = tiles.map(r => [...r]);
    newTiles[emptyPos.row][emptyPos.col] = newTiles[row][col];
    newTiles[row][col] = 0;
    const newEmpty = { row, col };
    setTiles(newTiles);
    setEmptyPos(newEmpty);
    setMoves(m => m + 1);
    if (checkWin(newTiles)) {
      setWon(true);
      if (navigator.vibrate) navigator.vibrate([60, 30, 100]);
      const { question, idx } = getRandomQuestion(usedQIdxs);
      setCurrentQuestion(question);
      setCurrentQIdx(idx);
      setTimeout(() => setPhase("player2-answer"), 600);
    }
  };

  const handleNewQuestion = () => {
    const { question, idx } = getRandomQuestion(usedQIdxs);
    setCurrentQuestion(question);
    setCurrentQIdx(idx);
  };

  const handleSaveAnswer = () => {
    if (!answer.trim()) return;
    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);
    const mem = MEMORIES[memoryIdx];
    setSavedAnswers(prev => [...prev, { memory: mem.title, question: currentQuestion, answer: answer.trim() }]);
    const newUsed = new Set(usedQIdxs);
    if (currentQIdx >= 0) newUsed.add(currentQIdx);
    setUsedQIdxs(newUsed);
    setAnswer("");
    setAnswerSaved(true);
  };

  const handleNextMemory = () => {
    if (memoryIdx >= MEMORIES.length - 1) {
      setPhase("complete");
      return;
    }
    setMemoryIdx(i => i + 1);
    setPhase("player1-puzzle");
    setAnswerSaved(false);
    setWon(false);
    doShuffle();
  };

  const memory = MEMORIES[memoryIdx];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <motion.button className="text-sm text-muted-foreground" onClick={() => navigate("/")} whileTap={{ scale: 0.95 }}>
          ← Back
        </motion.button>
        <h1 className="font-bold">Memory Vault</h1>
        <div className="text-sm text-muted-foreground">{memoryIdx + 1}/{MEMORIES.length}</div>
      </div>

      {phase === "complete" ? (
        <motion.div
          className="flex-1 flex flex-col items-center justify-center p-6 gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-center" style={{ textShadow: "0 0 20px hsl(30 90% 55% / 0.6)" }}>
            Vault Complete!
          </h2>
          <p className="text-muted-foreground text-center">You've unlocked all {MEMORIES.length} memories together.</p>

          <div className="w-full max-w-sm flex flex-col gap-3">
            {savedAnswers.map((a, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border bg-card p-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-xs text-muted-foreground mb-1">{a.memory}</div>
                <div className="text-sm text-accent mb-2 italic">"{a.question}"</div>
                <div className="text-sm font-medium">"{a.answer}"</div>
              </motion.div>
            ))}
          </div>
          <motion.button
            className="w-full max-w-sm rounded-2xl py-4 font-bold"
            style={{ background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(30 90% 55%))", boxShadow: "0 0 20px hsl(350 80% 60% / 0.4)" }}
            onClick={() => { setMemoryIdx(0); setPhase("player1-puzzle"); setAnswerSaved(false); setWon(false); setSavedAnswers([]); setUsedQIdxs(new Set()); doShuffle(); }}
            whileTap={{ scale: 0.97 }}
          >
            Play Again
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Memory card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={memoryIdx}
              className="mx-4 mb-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-4"
              style={{ boxShadow: "0 0 20px hsl(30 90% 55% / 0.1)" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="text-4xl">{memory.emoji}</div>
              <div>
                <div className="text-xs text-muted-foreground">{memory.hint}</div>
                <div className="font-bold text-accent" style={{ textShadow: "0 0 8px hsl(30 90% 55% / 0.5)" }}>
                  {memory.title}
                </div>
              </div>
              <div
                className="ml-auto text-xs font-bold px-2 py-1 rounded-full"
                style={phase === "player2-answer"
                  ? { background: "hsl(140 70% 45% / 0.15)", color: "hsl(140 70% 50%)" }
                  : { background: "hsl(240 30% 15%)", color: "hsl(240 20% 68%)" }
                }
              >
                {phase === "player2-answer" ? "🔓 Unlocked" : "🔒 Locked"}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Turn badge */}
          <div className="mx-4 mb-3">
            <div
              className="rounded-xl border p-3 text-center text-sm font-medium"
              style={phase === "player1-puzzle"
                ? { borderColor: "hsl(350 80% 60% / 0.4)", color: "hsl(350 80% 60%)", background: "hsl(350 80% 60% / 0.08)" }
                : { borderColor: "hsl(190 90% 50% / 0.4)", color: "hsl(190 90% 50%)", background: "hsl(190 90% 50% / 0.08)" }
              }
            >
              {phase === "player1-puzzle"
                ? "🧩 Player 1 — Solve the puzzle to unlock the memory"
                : "💬 Player 2 — Answer the question below"}
            </div>
          </div>

          {/* Sliding puzzle */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl border border-border p-3 mx-auto"
              style={{ background: "hsl(240 40% 3%)", maxWidth: "280px" }}
            >
              <div className="grid grid-cols-3 gap-2 mb-3">
                {tiles.map((row, r) =>
                  row.map((val, c) => (
                    <motion.div
                      key={`${r}-${c}`}
                      className={`aspect-square rounded-xl flex items-center justify-center text-xl font-bold cursor-pointer select-none ${val === 0 ? "opacity-0 pointer-events-none" : ""}`}
                      style={val === 0 ? {} : {
                        background: "linear-gradient(145deg, hsl(30 90% 55% / 0.25), hsl(30 90% 55% / 0.1))",
                        border: "1px solid hsl(30 90% 55% / 0.35)",
                        color: "hsl(30 90% 55%)",
                        boxShadow: "0 4px 0 hsl(30 90% 20%), 0 0 8px hsl(30 90% 55% / 0.2)",
                      }}
                      onClick={() => handleTileClick(r, c)}
                      whileTap={val !== 0 && phase === "player1-puzzle" ? { scale: 0.92 } : {}}
                      animate={won && val !== 0 ? { scale: [1, 1.05, 1] } : {}}
                    >
                      {val !== 0 ? val : ""}
                    </motion.div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl border border-border py-2 text-xs text-muted-foreground"
                  onClick={doShuffle}
                  disabled={phase !== "player1-puzzle"}
                >
                  🔄 Shuffle
                </button>
                <div className="flex-1 rounded-xl border border-border py-2 text-xs text-center text-muted-foreground">
                  {moves} moves
                </div>
              </div>
            </div>
          </div>

          {/* Answer panel */}
          <AnimatePresence>
            {phase === "player2-answer" && (
              <motion.div
                className="mx-4 mb-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 flex flex-col gap-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{ boxShadow: "0 0 20px hsl(190 90% 50% / 0.1)" }}
              >
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Question for Player 2</div>
                  <div className="font-medium text-secondary leading-snug" style={{ textShadow: "0 0 8px hsl(190 90% 50% / 0.4)" }}>
                    {currentQuestion}
                  </div>
                </div>

                {!answerSaved ? (
                  <>
                    <textarea
                      className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-secondary resize-none"
                      placeholder="Your answer..."
                      rows={3}
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <motion.button
                        className="flex-none rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground"
                        onClick={handleNewQuestion}
                        whileTap={{ scale: 0.95 }}
                      >
                        🎲 New question
                      </motion.button>
                      <motion.button
                        className="flex-1 rounded-xl py-2 text-sm font-bold"
                        style={{ background: "hsl(190 90% 50%)", boxShadow: "0 0 15px hsl(190 90% 50% / 0.35)", color: "hsl(240 40% 4%)" }}
                        onClick={handleSaveAnswer}
                        whileTap={{ scale: 0.97 }}
                        disabled={!answer.trim()}
                      >
                        Save Answer
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-sm text-muted-foreground text-center">Answer saved! Ready for next memory.</div>
                    <motion.button
                      className="w-full rounded-2xl py-4 font-bold"
                      style={{ background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(30 90% 55%))", boxShadow: "0 0 20px hsl(350 80% 60% / 0.3)" }}
                      onClick={handleNextMemory}
                      whileTap={{ scale: 0.97 }}
                    >
                      {memoryIdx < MEMORIES.length - 1 ? "Next Memory →" : "Complete the Vault!"}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
