import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-lg font-bold glow-text">MCAsianTiers</span>
          <span className="text-sm text-muted-foreground">The premier PvP ranking cockpit.</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Leaderboard</Link>
          <Link href="/admin" className="hover:text-primary transition-colors">Admin Portal</Link>
        </div>
      </div>
    </footer>
  );
}
