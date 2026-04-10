import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  backTo?: string;
  className?: string;
}

export function Layout({ children, title, backTo = "/", className = "" }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full max-w-md mx-auto relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <header className="flex items-center justify-between p-4 z-10 sticky top-0 bg-background/50 backdrop-blur-md border-b border-border/50">
        <Link href={backTo} className="p-2 -ml-2 rounded-full hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-display font-bold tracking-tight glow-text-primary">{title}</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <main className={`flex-1 flex flex-col z-10 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
