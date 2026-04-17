import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import io, { Socket } from "socket.io-client";
import { CATEGORIES, PROMPTS, Category } from "./TruthOrDareOffline"; // reuse prompts

type GameState = "lobby" | "inviting" | "waiting" | "playing";
type Player = { id: string; name: string };
type Prompt = { type: "truth" | "dare"; text: string; category: string };
type GameMode = "select" | "offline" | "online";

type PromptType = "truth" | "dare";
type Phase = "player1-draw" | "player1-dare-pending" | "player2-draw";

type ChatMessage = { from: string; message: string; timestamp: number };

interface PromptInterface { type: PromptType; text: string; category: string }

// Offline Truth or Dare Component
function TruthOrDareOffline() {
  const [, navigate] = useLocation();

  const [category, setCategory] = useState("normal");
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<Phase>("player1-draw");
  const [currentPrompt, setCurrentPrompt] = useState<PromptInterface | null>(null);
  const [lastPrompt, setLastPrompt] = useState<PromptInterface | null>(null);
  const [dareCompleted, setDareCompleted] = useState(false);
  const [roundCount, setRoundCount] = useState(0);

  const getRandom = (type: PromptType) => {
    const pool = PROMPTS[category][type === "truth" ? "truths" : "dares"];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleDraw = (type: PromptType) => {
    if (navigator.vibrate) navigator.vibrate(50);

    const text = getRandom(type);
    const prompt: PromptInterface = { type, text, category };

    setLastPrompt(currentPrompt);
    setCurrentPrompt(prompt);
    setDareCompleted(false);

    if (type === "dare") {
      setPhase("player1-dare-pending");
    } else {
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
    const prompt: PromptInterface = { type, text, category };
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
          {CATEGORIES.map((cat: Category) => (
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
        {CATEGORIES.find((c: Category) => c.id === category)?.emoji} {CATEGORIES.find((c: Category) => c.id === category)?.label} mode · {PROMPTS[category].truths.length + PROMPTS[category].dares.length} prompts
      </div>
    </div>
  );
}

// Online Truth or Dare Component
function TruthOrDareOnline() {
  const [, navigate] = useLocation();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; avatar: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "create">("login");
  const [selectedAvatar, setSelectedAvatar] = useState("🎭");
  const [password, setPassword] = useState("");

  // Online mode states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myName, setMyName] = useState("");
  const [myId, setMyId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchedPlayers, setSearchedPlayers] = useState<{ id: number; name: string; avatar: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [invites, setInvites] = useState<{ from: string; fromName: string; roomId: string }[]>([]);
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [lastPrompt, setLastPrompt] = useState<Prompt | null>(null);
  const [myTurn, setMyTurn] = useState(false);
  const [category, setCategory] = useState("normal");
  const [waitingForDareComplete, setWaitingForDareComplete] = useState(false);
  const [roundCount, setRoundCount] = useState(0);

  // Chat functionality
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [answerText, setAnswerText] = useState("");

  const CHAT_HISTORY_KEY = "truthordare_chat_history";

  const [serverUrl, setServerUrl] = useState(`http://${window.location.hostname}:8000`);

  const clearChat = () => {
    setChatMessages([]);
    setChatInput("");
    setShowChat(false);
    setAnswerText("");
  };

  // Check for stored authentication on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("truthordare_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setMyName(user.name);
      } catch (error) {
        localStorage.removeItem("truthordare_user");
      }
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      const history = saved ? (JSON.parse(saved) as Record<string, ChatMessage[]>) : {};
      setChatMessages(history[roomId] ?? []);
    } catch (error) {
      setChatMessages([]);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      const history = saved ? (JSON.parse(saved) as Record<string, ChatMessage[]>) : {};
      history[roomId] = chatMessages;
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      // ignore storage errors
    }
  }, [chatMessages, roomId]);

  // Avatar options
  const AVATAR_OPTIONS = ["🎭", "👤", "🦊", "🐱", "🐶", "🐼", "🐨", "🦁", "🐯", "🦄", "🐸", "🐵", "🙈", "🙉", "🙊"];

  // Handle authentication
  const handleAuth = async (username: string, password: string, avatar?: string) => {
    if (!username.trim() || !password.trim()) return;

    setAuthLoading(true);
    setAuthError("");

    try {
      const requestBody = authMode === "create"
        ? { name: username.trim(), password: password.trim(), avatar: avatar || "🎭" }
        : { name: username.trim(), password: password.trim() };

      const response = await fetch("http://localhost:8000/api/players/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const data = await response.json();
      const user = data.player;

      // Store in localStorage
      localStorage.setItem("truthordare_user", JSON.stringify(user));

      setCurrentUser(user);
      setIsAuthenticated(true);
      setMyName(user.name);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to authenticate. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("truthordare_user");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setMyName("");
    if (socket) {
      socket.disconnect();
    }
    clearChat();
  };

  // Search for players using backend API
  const searchPlayers = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchedPlayers([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/players/search/${encodeURIComponent(trimmed)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchedPlayers((data || []).filter((p: any) => p.id !== currentUser?.id));
      } else {
        setSearchedPlayers([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchedPlayers([]);
    }
  };

  useEffect(() => {
    const newSocket = io(serverUrl); // backend URL
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected", newSocket.id);
      setMyId(newSocket.id || "");
    });

    newSocket.on("playersList", (playersList: Player[]) => {
      setPlayers(playersList.filter(p => p.id !== newSocket.id));
    });

    newSocket.on("inviteReceived", ({ from, fromName, roomId }) => {
      setInvites(prev => [...prev, { from, fromName, roomId }]);
    });

    newSocket.on("inviteAccepted", ({ roomId, opponentName }) => {
      setRoomId(roomId);
      setOpponent({ id: "", name: opponentName });
      setGameState("playing");
      setMyTurn(true); // inviter goes first
      newSocket.emit("joinRoom", { roomId, name: myName });
    });

    newSocket.on("gameStart", ({ roomId, opponentName, turn }) => {
      setRoomId(roomId);
      setOpponent({ id: "", name: opponentName });
      setGameState("playing");
      setMyTurn(turn === 'player2'); // player2 starts with turn 'player1', so myTurn false
      newSocket.emit("joinRoom", { roomId, name: myName });
    });

    newSocket.on("reconnected", ({ roomId, opponentName, turn, currentPrompt, myTurn }) => {
      setRoomId(roomId);
      setOpponent({ id: "", name: opponentName });
      setGameState("playing");
      setCurrentPrompt(currentPrompt);
      setMyTurn(myTurn);
    });

    newSocket.on("promptReceived", (prompt: Prompt) => {
      setLastPrompt(currentPrompt);
      setCurrentPrompt(prompt);
      setAnswerText("");
      setWaitingForDareComplete(prompt.type === "dare");
    });

    newSocket.on("turnChanged", ({ nextPlayerName }) => {
      setMyTurn(nextPlayerName === myName);
      setWaitingForDareComplete(false);
      setCurrentPrompt(null);
      setAnswerText("");
    });

    newSocket.on("gameEnded", () => {
      alert("Game ended by opponent");
      setGameState("lobby");
      setRoomId(null);
      setOpponent(null);
      clearChat();
    });

    newSocket.on("chatMessage", ({ from, message, timestamp }) => {
      setChatMessages(prev => [...prev, { from, message, timestamp }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl]);

  const handleLogin = () => {
    if (myName.trim()) {
      socket?.emit("register", myName);
      setLoggedIn(true);
    }
  };

  const sendInvite = (toId: string) => {
    socket?.emit("invite", { to: toId });
    setGameState("inviting");
  };

  const acceptInvite = (invite: typeof invites[0]) => {
    socket?.emit("acceptInvite", { roomId: invite.roomId, from: invite.from });
    setInvites(prev => prev.filter(i => i.roomId !== invite.roomId));
  };

  const declineInvite = (invite: typeof invites[0]) => {
    socket?.emit("declineInvite", { roomId: invite.roomId });
    setInvites(prev => prev.filter(i => i.roomId !== invite.roomId));
  };

  const getRandomPrompt = (type: "truth" | "dare") => {
    const pool = PROMPTS[category][type === "truth" ? "truths" : "dares"];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleDraw = (type: "truth" | "dare") => {
    if (!myTurn || !roomId) return;
    const text = getRandomPrompt(type);
    const prompt: Prompt = { type, text, category };
    socket?.emit("sendPrompt", { roomId, prompt });
    setCurrentPrompt(prompt);
    setWaitingForDareComplete(type === "dare");
  };

  const handleAcceptAnswer = () => {
    if (!roomId || !answerText.trim()) return;
    const answer = answerText.trim();
    socket?.emit("answerAccepted", { roomId, answer });
    setChatMessages(prev => [...prev, { from: myName, message: answer, timestamp: Date.now() }]);
    setAnswerText("");
  };

  const handleDareComplete = () => {
    if (!roomId) return;
    socket?.emit("dareComplete", { roomId });
    setWaitingForDareComplete(false);
    setCurrentPrompt(null);
  };

  const sendChatMessage = () => {
    if (!roomId || !chatInput.trim()) return;
    const message = chatInput.trim();
    socket?.emit("sendChat", { roomId, message });
    setChatMessages(prev => [...prev, { from: myName, message, timestamp: Date.now() }]);
    setChatInput("");
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-xl font-bold text-center">
            {authMode === "create" ? "Create Account" : "Login"}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {authMode === "create"
              ? "Choose your name and avatar to play online"
              : "Enter your username to continue playing"
            }
          </p>

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setAuthMode("create")}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                authMode === "create"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                authMode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
          </div>

          {authError && (
            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
              {authError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth(myName, password, authMode === "create" ? selectedAvatar : undefined);
            }}
            className="space-y-4"
          >
            <input
              type="text"
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="Enter your username"
              disabled={authLoading}
              minLength={2}
              maxLength={20}
            />

            <input
              type="password"
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={authLoading}
              minLength={4}
              maxLength={50}
            />

            {authMode === "create" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose your avatar</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`aspect-square rounded-lg border-2 text-2xl flex items-center justify-center transition-colors ${
                        selectedAvatar === avatar
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      disabled={authLoading}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 font-bold"
              disabled={authLoading || myName.trim().length < 2 || password.trim().length < 4}
              whileTap={{ scale: 0.97 }}
            >
              {authLoading
                ? (authMode === "create" ? "Creating Account..." : "Logging in...")
                : (authMode === "create" ? "Create Account" : "Login")
              }
            </motion.button>
          </form>

          <button
            onClick={() => navigate("/truth-or-dare")}
            className="w-full text-sm text-muted-foreground"
          >
            ← Back to mode selection
          </button>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-xl font-bold">Enter your name</h2>
          <input
            type="text"
            className="w-full rounded-xl border border-border bg-background px-4 py-2"
            value={myName}
            onChange={e => setMyName(e.target.value)}
            placeholder="Your name"
          />
          <motion.button
            className="w-full rounded-xl bg-primary py-2 font-bold"
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
          >
            Join Lobby
          </motion.button>
        </div>
      </div>
    );
  }

  if (gameState === "playing" && opponent) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => { socket?.emit("leaveGame", { roomId }); setGameState("lobby"); clearChat(); }} className="text-muted-foreground">← Exit</button>
          <h1 className="font-bold">vs {opponent.name}</h1>
          <div className="text-sm">{myTurn ? "Your turn" : "Opponent's turn"}</div>
        </div>

        {/* Category picker (only visible on your turn) */}
        {myTurn && !currentPrompt && (
          <div className="px-2 mb-4 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {CATEGORIES.map((cat: Category) => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} className={`px-3 py-1 rounded-full text-xs ${category === cat.id ? "bg-primary text-white" : "bg-muted"}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {currentPrompt ? (
              <motion.div className="rounded-3xl border p-6 text-center max-w-sm" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <div className="text-4xl mb-2">{currentPrompt.type === "truth" ? "🕊️" : "⚡"}</div>
                <p className="text-lg font-semibold">{currentPrompt.text}</p>
                <div className="text-xs mt-2 text-muted-foreground">{currentPrompt.type.toUpperCase()} · {CATEGORIES.find((c: Category) => c.id === category)?.label}</div>
              </motion.div>
            ) : (
              <div className="text-center text-muted-foreground">{myTurn ? "Choose Truth or Dare" : "Waiting for opponent..."}</div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button onClick={() => handleDraw("truth")} disabled={!myTurn} className="rounded-xl bg-cyan-600 py-3 font-bold disabled:opacity-50">🕊️ TRUTH</button>
          <button onClick={() => handleDraw("dare")} disabled={!myTurn} className="rounded-xl bg-rose-600 py-3 font-bold disabled:opacity-50">⚡ DARE</button>
          <button onClick={() => handleDraw(Math.random() > 0.5 ? "truth" : "dare")} disabled={!myTurn} className="rounded-xl bg-violet-600 py-3 font-bold disabled:opacity-50">🎲 RANDOM</button>
        </div>

        {currentPrompt && (
          <div className="mt-4 w-full max-w-sm space-y-3">
            {/* Chat toggle button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full rounded-xl bg-blue-600 py-2 font-bold text-sm"
            >
              💬 {showChat ? "Hide" : "Show"} Chat
            </button>

            {/* Chat messages */}
            {showChat && (
              <div className="bg-card rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">No messages yet</div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className={`text-sm ${msg.from === myName ? "text-right" : "text-left"}`}>
                      <div className={`inline-block px-2 py-1 rounded-lg max-w-xs break-words ${
                        msg.from === myName
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <div className="font-medium text-xs opacity-75">{msg.from}</div>
                        <div>{msg.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat input */}
            {showChat && (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your response..."
                  onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-sm disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            )}

            {!myTurn && (
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  {currentPrompt.type === "dare"
                    ? "Complete the dare and submit your answer to continue."
                    : "Answer the truth and accept your answer to continue."
                  }
                </div>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your answer..."
                  onKeyPress={(e) => e.key === "Enter" && handleAcceptAnswer()}
                />
                <button
                  onClick={handleAcceptAnswer}
                  disabled={!answerText.trim()}
                  className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-sm disabled:opacity-50"
                >
                  ✅ Accept Answer
                </button>
              </div>
            )}

            {myTurn && currentPrompt && (
              <div className="mt-3 text-center text-sm text-muted-foreground">
                Waiting for your opponent to answer the {currentPrompt.type}.
              </div>
            )}
          </div>
        )}

        {!myTurn && currentPrompt && currentPrompt.type === "truth" && (
          <div className="mt-4 text-center text-sm text-muted-foreground">Opponent is answering truth...</div>
        )}
      </div>
    );
  }

  // Lobby view
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">Lobby</h1>
          <p className="text-sm text-muted-foreground">Playing as {currentUser?.name}</p>
          <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="Server URL" className="w-full rounded-xl border border-border bg-background px-4 py-2 mt-2" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="text-sm text-muted-foreground px-3 py-1 rounded border">
            Logout
          </button>
          <button onClick={() => { socket?.disconnect(); clearChat(); navigate("/"); }} className="text-muted-foreground">Leave</button>
        </div>
      </div>

      {/* Incoming invites */}
      {invites.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-sm font-semibold">Invites</h2>
          {invites.map(inv => (
            <div key={inv.roomId} className="flex justify-between items-center bg-card p-3 rounded-xl">
              <span>{inv.fromName} invited you</span>
              <div className="flex gap-2">
                <button onClick={() => acceptInvite(inv)} className="text-green-500">Accept</button>
                <button onClick={() => declineInvite(inv)} className="text-red-500">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & player list */}
      <input
        type="text"
        placeholder="Search players..."
        className="w-full rounded-xl border border-border bg-background px-4 py-2 mb-4"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          searchPlayers(e.target.value);
        }}
      />
      <div className="space-y-2">
        {searchTerm && searchedPlayers.length === 0 && <div className="text-center text-muted-foreground">No players found</div>}
        {!searchTerm && players.length === 0 && <div className="text-center text-muted-foreground">No players online</div>}
        {(searchTerm ? searchedPlayers : players).map(p => (
          <div key={p.id} className="flex justify-between items-center bg-card p-3 rounded-xl">
            <span>{p.name}</span>
            <button onClick={() => sendInvite(p.id.toString())} className="text-primary">Invite</button>
          </div>
        ))}
      </div>

      {gameState === "inviting" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-2xl">Waiting for opponent to accept...</div>
        </div>
      )}
    </div>
  );
}

// Main Truth or Dare Component with Mode Selection
export default function TruthOrDare() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<GameMode>("select");

  // Clear chat when switching modes
  useEffect(() => {
    if (mode !== "online") {
      // We'll clear chat in the online component itself
    }
  }, [mode]);

  if (mode === "offline") {
    return <TruthOrDareOffline />;
  }

  if (mode === "online") {
    return <TruthOrDareOnline />;
  }

  // Mode selection screen
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <motion.button className="text-sm text-muted-foreground" onClick={() => navigate("/")} whileTap={{ scale: 0.95 }}>
          ← Back
        </motion.button>
        <h1 className="font-bold">Truth or Dare</h1>
        <div></div>
      </div>

      {/* Mode selection */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold mb-2">Choose Your Mode</h2>
          <p className="text-muted-foreground">Play with a partner or go online</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <motion.button
            className="w-full rounded-2xl py-6 font-bold text-lg flex items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(30 90% 55%))", boxShadow: "0 0 20px hsl(350 80% 60% / 0.4)" }}
            onClick={() => setMode("offline")}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-2xl">👥</span>
            <div className="text-left">
              <div>Offline Mode</div>
              <div className="text-sm opacity-80">Play with a partner</div>
            </div>
          </motion.button>

          <motion.button
            className="w-full rounded-2xl py-6 font-bold text-lg flex items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg, hsl(190 90% 50%), hsl(220 90% 50%))", boxShadow: "0 0 20px hsl(190 90% 50% / 0.4)" }}
            onClick={() => setMode("online")}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-2xl">🌐</span>
            <div className="text-left">
              <div>Online Mode</div>
              <div className="text-sm opacity-80">Play with anyone online</div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Back to Main Menu Button */}
      <div className="p-4 border-t border-border">
        <motion.button
          onClick={() => navigate("/")}
          className="w-full rounded-xl bg-muted py-3 font-bold text-sm text-muted-foreground hover:text-foreground"
          whileTap={{ scale: 0.97 }}
        >
          ← Back to Main Menu
        </motion.button>
      </div>
    </div>
  );
}
