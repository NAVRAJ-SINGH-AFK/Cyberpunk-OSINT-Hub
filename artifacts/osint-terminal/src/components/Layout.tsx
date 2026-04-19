import { ReactNode } from "react";
import { Link } from "wouter";
import { MatrixRain } from "./MatrixRain";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden crt">
      <div className="scanlines" />
      <MatrixRain />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-border p-4 bg-background/80 backdrop-blur flex items-center justify-between">
          <Link href="/">
            <div className="text-xl font-bold glow-text cursor-pointer hover:text-primary/80 transition-colors">
              OSINT_TERMINAL v1.0
              <span className="animate-pulse">_</span>
            </div>
          </Link>
          <div className="text-xs text-muted-foreground flex gap-4">
            <span>SYS.STATUS: <span className="text-primary">ONLINE</span></span>
            <span>TIME: {new Date().toISOString()}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-background/60 backdrop-blur-sm">
          {children}
        </main>

        <footer className="border-t border-border p-2 text-center text-xs text-muted-foreground bg-background/80">
          WARNING: UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
        </footer>
      </div>
    </div>
  );
}
