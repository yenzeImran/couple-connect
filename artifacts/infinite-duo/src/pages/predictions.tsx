import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetPredictions,
  useCreatePrediction,
  useResolvePrediction,
  useGetPredictionHistory,
  getGetPredictionsQueryKey,
  getGetPredictionHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerStore } from "@/lib/store";

const BET_OPTIONS = [10, 25, 50, 100, 200, 500];

export default function Predictions() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { player1Id, player2Id } = usePlayerStore();

  const { data: predictions = [], isLoading } = useGetPredictions();
  const { data: history } = useGetPredictionHistory();
  const createPrediction = useCreatePrediction();
  const resolvePrediction = useResolvePrediction();

  const [tab, setTab] = useState<"active" | "history">("active");
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [prediction, setPrediction] = useState("");
  const [betPoints, setBetPoints] = useState(50);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(player1Id);

  const pending = predictions.filter(p => p.status === "pending");
  const resolved = predictions.filter(p => p.status !== "pending");

  const handleCreate = () => {
    if (!question.trim() || !prediction.trim() || !selectedPlayerId) return;
    if (navigator.vibrate) navigator.vibrate(50);
    createPrediction.mutate(
      { data: { playerId: selectedPlayerId, question: question.trim(), prediction: prediction.trim(), betPoints } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetPredictionsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetPredictionHistoryQueryKey() });
          setQuestion("");
          setPrediction("");
          setBetPoints(50);
          setShowForm(false);
        },
      }
    );
  };

  const handleResolve = (id: number, correct: boolean) => {
    if (navigator.vibrate) navigator.vibrate(correct ? [50, 30, 100] : [100, 30, 50]);
    resolvePrediction.mutate(
      { id, data: { correct } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetPredictionsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetPredictionHistoryQueryKey() });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pb-0">
        <motion.button
          className="text-sm text-muted-foreground mb-4 block"
          onClick={() => navigate("/")}
          whileTap={{ scale: 0.95 }}
        >
          ← Back
        </motion.button>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Daily Predictions</h1>
          <motion.button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold"
            style={{ boxShadow: "0 0 15px hsl(350 80% 60% / 0.4)" }}
            onClick={() => setShowForm(!showForm)}
            whileTap={{ scale: 0.95 }}
          >
            {showForm ? "Cancel" : "+ Bet"}
          </motion.button>
        </div>
        {history && (
          <p className="text-sm text-muted-foreground mb-4">
            {history.winRate}% win rate · {history.correctPredictions}/{history.totalPredictions} correct
          </p>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="mx-4 mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          >
            {/* Player selector */}
            {player1Id && player2Id && (
              <div className="flex gap-2">
                {[player1Id, player2Id].map((pid, i) => (
                  <button
                    key={pid}
                    className={`flex-1 rounded-lg py-2 text-sm ${selectedPlayerId === pid ? "bg-primary text-white" : "bg-muted"}`}
                    onClick={() => setSelectedPlayerId(pid)}
                  >
                    Player {i + 1}
                  </button>
                ))}
              </div>
            )}
            <input
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="What's the prediction about? (e.g. 'Will I get home before 8pm?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <input
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="My prediction is... (e.g. 'Yes, definitely')"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Bet amount</p>
              <div className="flex gap-2 flex-wrap">
                {BET_OPTIONS.map((b) => (
                  <button
                    key={b}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${betPoints === b ? "bg-primary text-white" : "bg-muted"}`}
                    onClick={() => setBetPoints(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <motion.button
              className="w-full rounded-xl bg-primary py-3 font-bold text-sm"
              style={{ boxShadow: "0 0 15px hsl(350 80% 60% / 0.4)" }}
              onClick={handleCreate}
              whileTap={{ scale: 0.97 }}
              disabled={!question.trim() || !prediction.trim() || createPrediction.isPending}
            >
              {createPrediction.isPending ? "Placing bet..." : `Place ${betPoints} Point Bet`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="px-4 flex gap-2 mb-4">
        {(["active", "history"] as const).map((t) => (
          <button
            key={t}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${tab === t ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t === "active" ? `Active (${pending.length})` : `Resolved (${resolved.length})`}
          </button>
        ))}
      </div>

      {/* Predictions list */}
      <div className="flex-1 px-4 pb-6 flex flex-col gap-3 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : tab === "active" ? (
          pending.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-5xl mb-3">🎲</div>
              <p>No active predictions.</p>
              <p className="text-sm mt-1">Tap "+ Bet" to place your first one!</p>
            </div>
          ) : (
            pending.map((p, i) => (
              <motion.div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-0.5">{p.playerName}</div>
                    <div className="font-medium text-sm">{p.question}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 italic">"{p.prediction}"</div>
                  </div>
                  <div
                    className="text-sm font-bold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: "hsl(30 90% 55% / 0.15)", color: "hsl(30 90% 55%)" }}
                  >
                    {p.betPoints} pts
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <motion.button
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                    style={{ background: "hsl(140 70% 40% / 0.15)", color: "hsl(140 70% 50%)", border: "1px solid hsl(140 70% 40% / 0.3)" }}
                    onClick={() => handleResolve(p.id, true)}
                    whileTap={{ scale: 0.95 }}
                  >
                    Correct
                  </motion.button>
                  <motion.button
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                    style={{ background: "hsl(0 80% 60% / 0.15)", color: "hsl(0 80% 60%)", border: "1px solid hsl(0 80% 60% / 0.3)" }}
                    onClick={() => handleResolve(p.id, false)}
                    whileTap={{ scale: 0.95 }}
                  >
                    Wrong
                  </motion.button>
                </div>
              </motion.div>
            ))
          )
        ) : (
          resolved.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No resolved predictions yet.</p>
            </div>
          ) : (
            resolved.map((p, i) => (
              <motion.div
                key={p.id}
                className="rounded-2xl border bg-card p-4"
                style={{ borderColor: p.status === "correct" ? "hsl(140 70% 40% / 0.4)" : "hsl(0 80% 60% / 0.3)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-0.5">{p.playerName}</div>
                    <div className="font-medium text-sm">{p.question}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 italic">"{p.prediction}"</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={p.status === "correct"
                        ? { background: "hsl(140 70% 40% / 0.15)", color: "hsl(140 70% 50%)" }
                        : { background: "hsl(0 80% 60% / 0.15)", color: "hsl(0 80% 60%)" }
                      }
                    >
                      {p.status === "correct" ? `+${p.betPoints}` : `-${p.betPoints}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">{p.status}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )
        )}
      </div>
    </div>
  );
}
