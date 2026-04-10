import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Hub from "@/pages/hub";
import Players from "@/pages/players";
import Leaderboard from "@/pages/leaderboard";
import Predictions from "@/pages/predictions";
import ShadowDuel from "@/pages/shadow-duel";
import SyncUp from "@/pages/sync-up";
import TruthOrDare from "@/pages/truth-or-dare";
import MemoryVault from "@/pages/memory-vault";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Hub} />
      <Route path="/players" component={Players} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/predictions" component={Predictions} />
      <Route path="/shadow-duel" component={ShadowDuel} />
      <Route path="/sync-up" component={SyncUp} />
      <Route path="/truth-or-dare" component={TruthOrDare} />
      <Route path="/memory-vault" component={MemoryVault} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="min-h-[100dvh] w-full bg-background text-foreground dark selection:bg-primary/30">
            <Router />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
