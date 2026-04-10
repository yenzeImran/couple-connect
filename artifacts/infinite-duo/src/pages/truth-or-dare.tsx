import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/lib/store";

const CATEGORIES = [
  { id: "normal",   label: "Normal",   emoji: "🌿" },
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "flirty",   label: "Flirty",   emoji: "😘" },
  { id: "funny",    label: "Funny",    emoji: "🤣" },
  { id: "adult",    label: "Adult",    emoji: "🍷" },
  { id: "kidish",   label: "Kid-ish",  emoji: "🧸" },
  { id: "nasty",    label: "Nasty",    emoji: "🌶️" },
];

const PROMPTS: Record<string, { truths: string[]; dares: string[] }> = {
  normal: {
    truths: [
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
      "What's something you admire about how I handle hard days?",
      "What's your love language and do I speak it well?",
      "What's something you want to experience with me before we're old?",
    ],
    dares: [
      "Give me a 10-second shoulder massage.",
      "Sing the chorus of a love song to me.",
      "Tell me something you appreciate about me that you've never said aloud.",
      "Imitate my laugh.",
      "Hold my hand and look into my eyes for 20 seconds.",
      "Say something sweet in a funny accent.",
      "Text a mutual friend a compliment about our relationship.",
      "Draw a quick portrait of me in the air.",
      "Do your best impression of me waking up.",
      "Name three things you love about me without repeating yourself.",
    ],
  },
  romantic: {
    truths: [
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
      "What does home feel like to you and am I part of it?",
      "What's a romantic cliché you secretly want us to do?",
      "What would your ideal anniversary look like?",
      "What's a love letter you'd write me but haven't yet?",
    ],
    dares: [
      "Write me a two-line poem right now.",
      "Slow dance with me for 30 seconds.",
      "Tell me three things you love about me.",
      "Give me a forehead kiss.",
      "Hold both my hands and say something sweet.",
      "Plan a surprise date idea out loud.",
      "Give me a compliment starting with 'I love the way you...'",
      "Recreate how you think our first kiss felt.",
      "Look into my eyes for 30 seconds without talking.",
      "Text me a love song you want to dedicate to me.",
    ],
  },
  flirty: {
    truths: [
      "What's your favorite pickup line?",
      "What's the most attractive outfit I own?",
      "What's something I do that's a total turn-on?",
      "What's a flirty text you'd send me if we just met?",
      "What's your signature move when flirting?",
      "What's a compliment you've received that made you blush?",
      "What part of my personality do you find sexy?",
      "What's something you find cute when I do it?",
      "What's a cheesy line you secretly like?",
      "What's a physical feature of mine you can't resist?",
      "What's something I do without realizing that drives you wild?",
      "What's your go-to move to get my attention?",
      "When was the last time I made your heart skip?",
      "What's the most attractive thing I've said to you?",
      "If you could describe my energy in one word, what would it be?",
    ],
    dares: [
      "Say something seductive in a language I don't speak.",
      "Give me your best 'come hither' look.",
      "Whisper a pickup line in my ear.",
      "Tell me a cheesy compliment with a straight face.",
      "Use a pet name you've never used before.",
      "Try to make me blush.",
      "Give me a wink that would make anyone swoon.",
      "Trace your finger slowly down my arm.",
      "Do a little shimmy or playful dance move.",
      "Imitate a flirtatious movie scene.",
    ],
  },
  funny: {
    truths: [
      "What's the funniest thing that ever happened to us?",
      "What's a joke that always makes you laugh?",
      "What's the most embarrassing thing you've done in public?",
      "What's a ridiculous fear you have?",
      "What's the worst fashion trend you followed?",
      "What's the funniest autocorrect fail you've had?",
      "What's a weird food combination you enjoy?",
      "What's the most awkward date you've been on (before me)?",
      "What's a movie that makes you cry laughing?",
      "What's the most bizarre dream you've had about me?",
      "What would your villain name be and what's your evil plan?",
      "What animal do I remind you of and why?",
      "What's the weirdest thing you've Googled recently?",
      "What's a habit of yours that would horrify your parents?",
      "What's a nickname you secretly gave me in your head?",
    ],
    dares: [
      "Do your best celebrity impression.",
      "Tell a 'dad joke' and try not to laugh.",
      "Do an interpretive dance of how you feel right now.",
      "Make up a rap about our relationship on the spot.",
      "Talk without moving your lips for 20 seconds.",
      "Try to lick your elbow.",
      "Do a dramatic reading of a grocery list.",
      "Make the sound of an animal I choose.",
      "Try to make me laugh using only facial expressions.",
      "Walk across the room like a runway model.",
    ],
  },
  adult: {
    truths: [
      "What's a fantasy you've never told me about?",
      "What turns you on that I might not realize?",
      "What's your favorite part of my body?",
      "Have you ever had a dream about me that was spicy?",
      "When do you feel most attracted to me?",
      "What's something you'd like me to whisper in your ear?",
      "What's a movie scene you found unexpectedly arousing?",
      "What's a secret desire you're shy to admit?",
      "What's the most adventurous thing you'd want to try?",
      "What's something you want more of in our relationship?",
      "What time of day are you most in the mood?",
      "What's something I do that makes you feel wanted?",
      "What's a fantasy location you'd want to be intimate in?",
      "What song would be on your 'mood' playlist?",
      "What's something you want to ask me but haven't dared?",
    ],
    dares: [
      "Whisper something suggestive in my ear.",
      "Give me a sensual neck kiss.",
      "Describe what you'd do if we were alone right now.",
      "Send me a flirty text even though we're in the same room.",
      "Tell me a secret fantasy in three words.",
      "Give me a back scratch with your nails.",
      "Slow dance with me for 30 seconds with no music.",
      "Put your hand on my knee and leave it there.",
      "Say the most seductive thing you can think of with a straight face.",
      "Give me a kiss somewhere surprising.",
    ],
  },
  kidish: {
    truths: [
      "What was your favorite childhood TV show?",
      "What's the silliest thing you believed as a kid?",
      "What's a game you loved playing as a child?",
      "What was your favorite snack after school?",
      "What's a funny childhood memory?",
      "What's a toy you wished you still had?",
      "What's the most embarrassing thing you did as a kid?",
      "What's a cartoon character you had a crush on?",
      "What's a silly fear you had growing up?",
      "What's a family tradition from your childhood?",
      "What's the worst thing you ever blamed a sibling for?",
      "What's a made-up word you used as a child?",
      "What did you want to be when you grew up?",
      "What's the first thing you ever saved up money to buy?",
      "What's a song that takes you straight back to childhood?",
    ],
    dares: [
      "Do an impression of a cartoon character.",
      "Tell a joke a 7-year-old would love.",
      "Make a funny face and hold it for 10 seconds.",
      "Sing a nursery rhyme with exaggerated emotion.",
      "Do a silly walk across the room.",
      "Pretend you're a dinosaur for 20 seconds.",
      "Talk in a baby voice for one full minute.",
      "Balance a spoon on your nose.",
      "Draw a simple animal with your eyes closed.",
      "Imitate a famous children's show host.",
    ],
  },
  nasty: {
    truths: [
      "What's a roleplay scenario you'd enjoy?",
      "What's the naughtiest thought you've had today?",
      "Where's the riskiest place you'd want to be intimate?",
      "What's a body part of mine you fantasize about?",
      "What's the kinkiest thing you've ever done?",
      "What's a dirty word that turns you on?",
      "What's something you want to try that you saw in a movie?",
      "What's your favorite position?",
      "What would you want me to do if I woke you up in the middle of the night?",
      "What's the boldest thing you've ever said to someone you were attracted to?",
      "What's something you find irresistibly attractive that most people wouldn't expect?",
      "How long is the longest you could go without kissing me?",
      "What's the most daring thing you'd do in public?",
      "What would the title of a steamy book about us be?",
      "What's something you want but feel embarrassed asking for?",
    ],
    dares: [
      "Whisper the dirtiest word you can think of.",
      "Bite my lip gently.",
      "Tell me what you want me to do to you later.",
      "Describe in detail a fantasy involving us.",
      "Kiss me somewhere unexpected.",
      "Put your hand on my thigh and leave it there.",
      "Send me a suggestive emoji string describing your mood.",
      "Tell me your mood in three spicy words.",
      "Give me a hickey — or pretend to.",
      "Act out a scene from your favorite romantic movie.",
    ],
  },
};

type PromptType = "truth" | "dare";
type Phase = "player1-draw" | "player1-dare-pending" | "player2-draw";

interface Prompt { type: PromptType; text: string; category: string }

export default function TruthOrDare() {
  const [, navigate] = useLocation();
  const { player1Id, player2Id } = usePlayerStore();

  const [category, setCategory] = useState("normal");
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<Phase>("player1-draw");
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [lastPrompt, setLastPrompt] = useState<Prompt | null>(null);
  const [dareCompleted, setDareCompleted] = useState(false);
  const [roundCount, setRoundCount] = useState(0);

  const getRandom = (type: PromptType) => {
    const pool = PROMPTS[category][type === "truth" ? "truths" : "dares"];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleDraw = (type: PromptType) => {
    if (navigator.vibrate) navigator.vibrate(50);

    const text = getRandom(type);
    const prompt: Prompt = { type, text, category };

    setLastPrompt(currentPrompt);
    setCurrentPrompt(prompt);
    setDareCompleted(false);

    if (type === "dare") {
      setPhase("player1-dare-pending");
    } else {
      // Truth: after showing, other player draws next
      setPhase("player1-dare-pending");
    }
    setRoundCount(c => c + 1);
  };

  const handleDoneOrAnswered = () => {
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    setDareCompleted(true);
    setCurrentPlayer(p => p === 1 ? 2 : 1);
    setPhase("player2-draw");
    setCurrentPrompt(null);
  };

  const handlePlayer2Draw = (type: PromptType) => {
    if (navigator.vibrate) navigator.vibrate(50);
    const text = getRandom(type);
    const prompt: Prompt = { type, text, category };
    setLastPrompt(currentPrompt);
    setCurrentPrompt(prompt);
    setDareCompleted(false);
    setPhase("player1-draw");
    setCurrentPlayer(1);
    setRoundCount(c => c + 1);
  };

  const isPlayer1Turn = currentPlayer === 1;
  const playerLabel = `Player ${currentPlayer}`;
  const canDraw = phase === "player1-draw" || phase === "player2-draw";
  const waitingForDone = phase === "player1-dare-pending" && currentPrompt !== null;

  const promptBg = currentPrompt?.type === "truth"
    ? "linear-gradient(145deg, hsl(190 90% 50% / 0.15), hsl(190 90% 50% / 0.05))"
    : "linear-gradient(145deg, hsl(350 80% 60% / 0.15), hsl(350 80% 60% / 0.05))";
  const promptBorder = currentPrompt?.type === "truth"
    ? "hsl(190 90% 50% / 0.35)"
    : "hsl(350 80% 60% / 0.35)";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <motion.button className="text-sm text-muted-foreground" onClick={() => navigate("/")} whileTap={{ scale: 0.95 }}>
          ← Back
        </motion.button>
        <h1 className="font-bold">Truth or Dare</h1>
        <div className="text-sm text-muted-foreground">#{roundCount}</div>
      </div>

      {/* Turn indicator */}
      <motion.div
        className="mx-4 mb-3 rounded-2xl border border-border bg-card p-3 flex items-center gap-3"
        key={currentPlayer}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: isPlayer1Turn ? "hsl(350 80% 60% / 0.2)" : "hsl(190 90% 50% / 0.2)", border: `1px solid ${isPlayer1Turn ? "hsl(350 80% 60% / 0.5)" : "hsl(190 90% 50% / 0.5)"}` }}
        >
          {isPlayer1Turn ? "P1" : "P2"}
        </div>
        <div>
          <div className="font-semibold" style={{ color: isPlayer1Turn ? "hsl(350 80% 60%)" : "hsl(190 90% 50%)" }}>
            {playerLabel}'s Turn
          </div>
          <div className="text-xs text-muted-foreground">
            {waitingForDone
              ? `Complete the ${currentPrompt?.type} first, then pass`
              : canDraw
                ? "Choose Truth or Dare"
                : ""}
          </div>
        </div>
      </motion.div>

      {/* Category picker */}
      <div className="px-4 mb-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat.id}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border"
              style={category === cat.id
                ? { background: "hsl(350 80% 60% / 0.2)", borderColor: "hsl(350 80% 60% / 0.5)", color: "hsl(350 80% 60%)" }
                : { background: "hsl(240 35% 8%)", borderColor: "hsl(240 30% 14%)", color: "hsl(240 20% 68%)" }
              }
              onClick={() => setCategory(cat.id)}
              whileTap={{ scale: 0.93 }}
            >
              {cat.emoji} {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Prompt display */}
      <div className="flex-1 px-4 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {currentPrompt ? (
            <motion.div
              key={currentPrompt.text}
              className="rounded-3xl border p-6 flex flex-col items-center justify-center min-h-[180px] text-center"
              style={{ background: promptBg, borderColor: promptBorder }}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="text-4xl mb-3">{currentPrompt.type === "truth" ? "🕊️" : "⚡"}</div>
              <div className="text-lg font-semibold leading-snug mb-2">{currentPrompt.text}</div>
              <div
                className="text-sm font-bold px-3 py-1 rounded-full mt-1"
                style={{ background: currentPrompt.type === "truth" ? "hsl(190 90% 50% / 0.15)" : "hsl(350 80% 60% / 0.15)", color: currentPrompt.type === "truth" ? "hsl(190 90% 50%)" : "hsl(350 80% 60%)" }}
              >
                {currentPrompt.type.toUpperCase()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="rounded-3xl border border-border bg-card/50 p-6 flex flex-col items-center justify-center min-h-[180px] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-4xl mb-3">💬</div>
              <div className="text-muted-foreground">
                {phase === "player2-draw" ? "Player 2 is up — pick your fate!" : "Pick a category, then press Truth or Dare"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {waitingForDone ? (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center text-sm text-muted-foreground">
              {currentPrompt?.type === "dare"
                ? "Complete the dare first, then pass the phone to Player 2"
                : "Answer the truth, then pass the phone to Player 2"}
            </div>
            <motion.button
              className="w-full rounded-2xl py-4 font-bold text-base"
              style={{ background: "linear-gradient(135deg, hsl(140 70% 45%), hsl(190 90% 50%))", boxShadow: "0 0 25px hsl(140 70% 45% / 0.35)" }}
              onClick={handleDoneOrAnswered}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {currentPrompt?.type === "dare" ? "Dare Done! Pass Phone →" : "Answered! Pass Phone →"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              className="rounded-2xl py-5 font-bold text-lg"
              style={{ background: "linear-gradient(145deg, hsl(190 90% 40%), hsl(190 90% 30%))", boxShadow: "0 6px 0 hsl(190 90% 20%), 0 0 20px hsl(190 90% 50% / 0.3)" }}
              onClick={() => phase === "player2-draw" ? handlePlayer2Draw("truth") : handleDraw("truth")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95, y: 4 }}
            >
              🕊️ TRUTH
            </motion.button>
            <motion.button
              className="rounded-2xl py-5 font-bold text-lg"
              style={{ background: "linear-gradient(145deg, hsl(350 80% 50%), hsl(350 80% 38%))", boxShadow: "0 6px 0 hsl(350 80% 20%), 0 0 20px hsl(350 80% 60% / 0.3)" }}
              onClick={() => phase === "player2-draw" ? handlePlayer2Draw("dare") : handleDraw("dare")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95, y: 4 }}
            >
              ⚡ DARE
            </motion.button>
          </motion.div>
        )}

        {/* Last prompt hint */}
        {lastPrompt && (
          <div className="text-xs text-muted-foreground text-center">
            Last: {lastPrompt.type} — "{lastPrompt.text.slice(0, 45)}{lastPrompt.text.length > 45 ? "…" : ""}"
          </div>
        )}
      </div>

      <div className="p-4 text-center text-xs text-muted-foreground">
        {CATEGORIES.find(c => c.id === category)?.emoji} {CATEGORIES.find(c => c.id === category)?.label} mode · {PROMPTS[category].truths.length + PROMPTS[category].dares.length} prompts
      </div>
    </div>
  );
}
