import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const discordInviteUrl = "https://discord.gg/3Ggs6mAGJb";

const gamemodes = ["Overall", "Sword", "Axe", "Pot", "UHC", "NethPot", "Mace", "Tank", "SMP", "Spear-Mace", "Vanilla"] as const;
const tiers = ["God", "S+", "S", "HT1", "HT2", "HT3", "HT4", "HT5", "LT1", "LT2", "LT3", "LT4", "LT5"] as const;
const teamRoles = ["Owner", "Leader", "Staff"] as const;
const allowedAdminEmails = ["voidfury1527@gmail.com"];

type Gamemode = (typeof gamemodes)[number];
type Tier = (typeof tiers)[number];
type TeamRole = (typeof teamRoles)[number];

type Player = {
  id: string;
  name: string;
  tier: Tier;
  gamemode: Gamemode;
  points: number;
  region: string;
  createdAt?: string;
  updatedAt?: string;
};

type PlayerForm = {
  name: string;
  tier: Tier;
  gamemode: Gamemode;
  points: string;
  region: string;
};

type TierApplication = {
  id: string;
  username: string;
  discord: string;
  gamemode: Gamemode;
  region: string;
  experience: string;
  status: string;
  createdAt?: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  discord: string;
  createdAt?: string;
};

type ApplicationForm = {
  username: string;
  discord: string;
  gamemode: Gamemode;
  region: string;
  experience: string;
};

type TeamForm = {
  name: string;
  role: TeamRole;
  discord: string;
};

const emptyForm: PlayerForm = {
  name: "",
  tier: "HT1",
  gamemode: "Overall",
  points: "0",
  region: "NA",
};

const emptyApplicationForm: ApplicationForm = {
  username: "",
  discord: "",
  gamemode: "Sword",
  region: "NA",
  experience: "",
};

const emptyTeamForm: TeamForm = {
  name: "",
  role: "Staff",
  discord: "",
};

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function rankForTier(tier: Tier): string {
  if (tier === "God") return "World Champion";
  if (tier === "S+") return "Elite Contender";
  if (tier === "S") return "Pro Duelist";
  if (tier.startsWith("HT")) return "High Tier";
  return "Low Tier";
}

function tierScore(tier: Tier): number {
  return tiers.length - tiers.indexOf(tier);
}

function dateValue(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const playersQuery = query(collection(db, "players"), orderBy("points", "desc"));
    return onSnapshot(
      playersQuery,
      (snapshot) => {
        setPlayers(
          snapshot.docs.map((entry) => {
            const data = entry.data();
            return {
              id: entry.id,
              name: String(data.name ?? "Unknown"),
              tier: tiers.includes(data.tier) ? data.tier : "LT5",
              gamemode: gamemodes.includes(data.gamemode) ? data.gamemode : "Overall",
              points: Number(data.points ?? 0),
              region: String(data.region ?? "Global"),
              createdAt: dateValue(data.createdAt),
              updatedAt: dateValue(data.updatedAt),
            };
          }),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, []);

  return { players, loading, error };
}

function useApplications() {
  const [applications, setApplications] = useState<TierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const applicationsQuery = query(collection(db, "tierApplications"), orderBy("createdAt", "desc"));
    return onSnapshot(
      applicationsQuery,
      (snapshot) => {
        setApplications(
          snapshot.docs.map((entry) => {
            const data = entry.data();
            return {
              id: entry.id,
              username: String(data.username ?? ""),
              discord: String(data.discord ?? ""),
              gamemode: gamemodes.includes(data.gamemode) ? data.gamemode : "Sword",
              region: String(data.region ?? ""),
              experience: String(data.experience ?? ""),
              status: String(data.status ?? "pending"),
              createdAt: dateValue(data.createdAt),
            };
          }),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, []);

  return { applications, loading, error };
}

function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const teamQuery = query(collection(db, "teamMembers"), orderBy("createdAt", "desc"));
    return onSnapshot(
      teamQuery,
      (snapshot) => {
        setTeamMembers(
          snapshot.docs.map((entry) => {
            const data = entry.data();
            return {
              id: entry.id,
              name: String(data.name ?? ""),
              role: teamRoles.includes(data.role) ? data.role : "Staff",
              discord: String(data.discord ?? ""),
              createdAt: dateValue(data.createdAt),
            };
          }),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, []);

  return { teamMembers, loading, error };
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#FFD93D",
    colorBackground: "#07080D",
    colorInputBackground: "#11131C",
    colorText: "#FFF7CA",
    colorTextSecondary: "#B9AE7A",
    colorInputText: "#FFF7CA",
    colorNeutral: "#FFD93D",
    borderRadius: "18px",
    fontFamily: "Inter, system-ui, sans-serif",
    fontFamilyButtons: "Inter, system-ui, sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full overflow-hidden rounded-3xl border border-yellow-300/20 bg-black/80 shadow-[0_0_80px_rgba(255,217,61,.18)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    logoBox: "mx-auto mb-2 h-16 w-16",
    logoImage: "h-16 w-16 rounded-2xl shadow-[0_0_40px_rgba(255,217,61,.26)]",
    formButtonPrimary: "!bg-yellow-300 !text-black hover:!bg-yellow-200 !shadow-[0_0_28px_rgba(255,217,61,.24)]",
    socialButtonsBlockButton: "!border-yellow-300/20 !bg-white/5 hover:!bg-yellow-300/10",
    formFieldInput: "!border-yellow-300/20 !bg-black/40 !text-yellow-50 focus:!ring-yellow-300",
    dividerLine: "!bg-yellow-300/15",
    footerActionLink: "!text-yellow-300 hover:!text-yellow-200",
    headerTitle: { color: "#FFF7CA" },
    headerSubtitle: { color: "#B9AE7A" },
    socialButtonsBlockButtonText: { color: "#FFF7CA" },
    formFieldLabel: { color: "#FFF7CA" },
    footerActionText: { color: "#B9AE7A" },
    dividerText: { color: "#B9AE7A" },
    identityPreviewEditButton: { color: "#FFD93D" },
    formFieldSuccessText: { color: "#FFD93D" },
    alertText: { color: "#FFF7CA" },
  },
};

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) queryClient.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function Shell({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-mask pointer-events-none absolute inset-0 opacity-70" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="mcasiantiers" className="h-11 w-11 rounded-xl yellow-glow transition-transform group-hover:scale-105" />
          <div>
            <div className="text-lg font-black uppercase tracking-[0.22em] text-yellow-200 text-glow">mcasiantiers</div>
            <div className="text-xs uppercase tracking-[0.28em] text-yellow-100/45">Minecraft PvP tiers</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/" className="rounded-full border border-yellow-300/15 px-4 py-2 text-yellow-50/80 transition hover:border-yellow-300/40 hover:bg-yellow-300/10 hover:text-yellow-100">Leaderboard</Link>
          <a href={discordInviteUrl} target="_blank" rel="noreferrer" className="hidden rounded-full border border-yellow-300/15 px-4 py-2 text-yellow-50/80 transition hover:border-yellow-300/40 hover:bg-yellow-300/10 hover:text-yellow-100 sm:inline-flex">Discord</a>
          <a href="#apply" className="hidden rounded-full border border-yellow-300/15 px-4 py-2 text-yellow-50/80 transition hover:border-yellow-300/40 hover:bg-yellow-300/10 hover:text-yellow-100 md:inline-flex">Apply</a>
          <Link href="/admin" className="rounded-full bg-yellow-300 px-4 py-2 text-black shadow-[0_0_24px_rgba(255,217,61,.25)] transition hover:bg-yellow-200">Admin</Link>
          {isSignedIn ? (
            <button onClick={() => signOut({ redirectUrl: basePath || "/" })} className="hidden rounded-full border border-yellow-300/15 px-4 py-2 text-yellow-50/70 transition hover:border-yellow-300/40 hover:text-yellow-100 sm:block">Sign out</button>
          ) : null}
        </nav>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 sm:px-8">{children}</main>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const elite = ["God", "S+", "S", "HT1"].includes(tier);
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${elite ? "border-yellow-300/50 bg-yellow-300 text-black shadow-[0_0_22px_rgba(255,217,61,.35)]" : tier.startsWith("HT") ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-200" : "border-white/10 bg-white/5 text-yellow-50/60"}`}>
      {tier}
    </span>
  );
}

function PlayerAvatar({ name, size = "h-14 w-14" }: { name: string; size?: string }) {
  return <img src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}`} alt={name} className={`${size} rounded-2xl border border-yellow-300/25 bg-black object-cover shadow-[0_0_24px_rgba(255,217,61,.12)]`} />;
}

function PlayerCard({ player, index }: { player: Player; index: number }) {
  const [, setLocation] = useLocation();
  const top = index < 3 || ["God", "S+", "S"].includes(player.tier);

  return (
    <button onClick={() => setLocation(`/player/${player.id}`)} className={`group grid w-full grid-cols-[auto_1fr] gap-4 rounded-3xl border p-4 text-left transition duration-300 hover:-translate-y-1 sm:grid-cols-[auto_1fr_auto] sm:items-center ${top ? "border-yellow-300/28 bg-yellow-300/[0.07] shadow-[0_0_42px_rgba(255,217,61,.12)]" : "border-white/10 bg-white/[0.03] hover:border-yellow-300/24 hover:bg-yellow-300/[0.05]"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-300/15 bg-black/50 font-mono text-sm font-black text-yellow-200">#{index + 1}</div>
        <PlayerAvatar name={player.name} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="truncate text-xl font-black text-yellow-50 transition group-hover:text-yellow-200">{player.name}</h3>
          <TierBadge tier={player.tier} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-yellow-50/55">
          <span>{rankForTier(player.tier)}</span>
          <span className="text-yellow-300/40">/</span>
          <span>{player.gamemode}</span>
          <span className="text-yellow-300/40">/</span>
          <span>{player.region}</span>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between rounded-2xl border border-yellow-300/10 bg-black/35 px-4 py-3 sm:col-span-1 sm:block sm:text-right">
        <div className="text-xs uppercase tracking-[0.22em] text-yellow-100/40">Points</div>
        <div className="font-mono text-2xl font-black text-yellow-200">{player.points.toLocaleString()}</div>
      </div>
    </button>
  );
}

function TeamShowcase() {
  const { teamMembers, loading, error } = useTeamMembers();
  const roleOrder: Record<TeamRole, number> = { Owner: 0, Leader: 1, Staff: 2 };
  const sortedTeam = [...teamMembers].sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name));

  return (
    <section className="glass-panel mb-6 rounded-[2rem] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Official team</div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-yellow-50">Owners, leaders, and staff</h2>
        </div>
        <a href={discordInviteUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(255,217,61,.25)] transition hover:bg-yellow-200">Join Discord</a>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {sortedTeam.map((member) => (
          <div key={member.id} className="rounded-3xl border border-yellow-300/14 bg-black/35 p-4">
            <div className="mb-3 inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-yellow-200">{member.role}</div>
            <div className="text-xl font-black text-yellow-50">{member.name}</div>
            <div className="mt-1 text-sm text-yellow-50/50">{member.discord || "Discord not listed"}</div>
          </div>
        ))}
        {!loading && !error && sortedTeam.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-yellow-300/18 bg-black/25 p-5 text-yellow-50/55 md:col-span-3">No public team members have been added yet.</div>
        ) : null}
        {error ? <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-red-100 md:col-span-3">{error}</div> : null}
      </div>
    </section>
  );
}

function TierTestApplicationForm() {
  const [form, setForm] = useState<ApplicationForm>(emptyApplicationForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!form.username.trim() || !form.discord.trim() || !form.experience.trim()) {
        throw new Error("Username, Discord, and experience are required.");
      }

      await addDoc(collection(db, "tierApplications"), {
        username: form.username.trim(),
        discord: form.discord.trim(),
        gamemode: form.gamemode,
        region: form.region.trim() || "Global",
        experience: form.experience.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(emptyApplicationForm);
      setMessage("Application sent. Admin staff can now see it in the admin panel.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to send application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="apply" className="glass-panel mt-6 rounded-[2rem] p-6">
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Tier test applications</div>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] text-yellow-50">Apply directly from the site.</h2>
          <p className="mt-4 text-yellow-50/55">Players can request a tier test here. Your admin account can review every application from the admin page.</p>
          <a href={discordInviteUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full border border-yellow-300/25 px-5 py-3 font-bold text-yellow-100 transition hover:bg-yellow-300/10">Open Discord server</a>
        </div>
        <form onSubmit={submitApplication} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minecraft username"><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="admin-input" placeholder="Your IGN" /></Field>
            <Field label="Discord"><input value={form.discord} onChange={(event) => setForm({ ...form, discord: event.target.value })} className="admin-input" placeholder="name#0000 or username" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gamemode"><select value={form.gamemode} onChange={(event) => setForm({ ...form, gamemode: event.target.value as Gamemode })} className="admin-input">{gamemodes.filter((mode) => mode !== "Overall").map((mode) => <option key={mode}>{mode}</option>)}</select></Field>
            <Field label="Region"><input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="admin-input" placeholder="NA, EU, AS, OCE" /></Field>
          </div>
          <Field label="PvP experience"><textarea value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} className="admin-input min-h-28 py-3" placeholder="Tell staff your best gamemode, current tier, and availability." /></Field>
          {message ? <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-100">{message}</div> : null}
          <button disabled={saving} className="w-full rounded-2xl bg-yellow-300 px-5 py-3 font-black text-black transition hover:bg-yellow-200 disabled:opacity-50">{saving ? "Sending application" : "Apply for tier test"}</button>
        </form>
      </div>
    </section>
  );
}

function LeaderboardPage() {
  const { players, loading, error } = usePlayers();
  const [search, setSearch] = useState("");
  const [gamemode, setGamemode] = useState<Gamemode>("Overall");

  const filtered = useMemo(() => {
    return players
      .filter((player) => gamemode === "Overall" || player.gamemode === gamemode || player.gamemode === "Overall")
      .filter((player) => player.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => b.points - a.points || tierScore(b.tier) - tierScore(a.tier));
  }, [players, gamemode, search]);

  const topPlayer = filtered[0];
  const highTierCount = players.filter((player) => ["God", "S+", "S", "HT1", "HT2", "HT3"].includes(player.tier)).length;

  return (
    <Shell>
      <section className="grid gap-6 py-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div className="animate-rise">
          <div className="mb-4 inline-flex rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Official PvP leaderboard</div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-yellow-50 text-glow sm:text-7xl lg:text-8xl">Minecraft tiers built for competitive clarity.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-yellow-50/62">Browse elite players by gamemode, compare points, inspect tiers, and open player profiles with realtime Firebase-backed updates.</p>
        </div>
        <div className="glass-panel animate-rise rounded-[2rem] p-5 [animation-delay:120ms]">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Players" value={players.length.toString()} />
            <Metric label="High ranks" value={highTierCount.toString()} />
            <Metric label="Modes" value={gamemodes.length.toString()} />
          </div>
          {topPlayer ? (
            <div className="mt-4 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-yellow-100/45">Current leader</div>
              <div className="mt-3 flex items-center gap-4">
                <PlayerAvatar name={topPlayer.name} size="h-16 w-16" />
                <div>
                  <div className="text-2xl font-black text-yellow-100">{topPlayer.name}</div>
                  <div className="text-sm text-yellow-50/55">{topPlayer.points.toLocaleString()} points / {topPlayer.tier}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <TeamShowcase />

      <section className="glass-panel rounded-[2rem] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search username" className="h-13 w-full rounded-2xl border border-yellow-300/15 bg-black/45 px-5 text-yellow-50 outline-none transition placeholder:text-yellow-50/30 focus:border-yellow-300/55 focus:ring-4 focus:ring-yellow-300/10 lg:max-w-sm" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gamemodes.map((mode) => (
              <button key={mode} onClick={() => setGamemode(mode)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${gamemode === mode ? "border-yellow-300 bg-yellow-300 text-black shadow-[0_0_24px_rgba(255,217,61,.24)]" : "border-white/10 bg-white/[0.03] text-yellow-50/60 hover:border-yellow-300/35 hover:text-yellow-100"}`}>
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {loading ? <EmptyState title="Loading rankings" message="Connecting to Firebase and syncing the latest tier data." /> : null}
          {error ? <EmptyState title="Firebase connection issue" message={error} /> : null}
          {!loading && !error && filtered.length === 0 ? <EmptyState title="No players found" message="Add players from the admin panel or adjust your search and gamemode filters." /> : null}
          {filtered.map((player, index) => <PlayerCard key={player.id} player={player} index={index} />)}
        </div>
      </section>

      <TierTestApplicationForm />
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-yellow-300/12 bg-black/35 p-4 text-center">
      <div className="font-mono text-3xl font-black text-yellow-200">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-yellow-100/38">{label}</div>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-yellow-300/20 bg-black/25 p-8 text-center">
      <div className="text-xl font-black text-yellow-100">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-yellow-50/50">{message}</p>
    </div>
  );
}

function PlayerProfilePage({ params }: { params: { id: string } }) {
  const { players, loading, error } = usePlayers();
  const player = players.find((entry) => entry.id === params.id);
  const modePeers = player ? players.filter((entry) => entry.gamemode === player.gamemode).sort((a, b) => b.points - a.points) : [];
  const standing = player ? modePeers.findIndex((entry) => entry.id === player.id) + 1 : 0;

  return (
    <Shell>
      {loading ? <EmptyState title="Loading profile" message="Fetching player details from Firebase." /> : null}
      {error ? <EmptyState title="Firebase connection issue" message={error} /> : null}
      {!loading && !player ? <EmptyState title="Player not found" message="This player may have been deleted or has not been added yet." /> : null}
      {player ? (
        <section className="glass-panel animate-rise mt-10 overflow-hidden rounded-[2rem]">
          <div className="border-b border-yellow-300/12 bg-yellow-300/[0.06] p-6 sm:p-8">
            <Link href="/" className="text-sm font-bold text-yellow-200/80 transition hover:text-yellow-100">Back to leaderboard</Link>
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-5">
                <PlayerAvatar name={player.name} size="h-24 w-24" />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-5xl font-black tracking-[-0.05em] text-yellow-50 text-glow">{player.name}</h1>
                    <TierBadge tier={player.tier} />
                  </div>
                  <p className="mt-3 text-yellow-50/55">{rankForTier(player.tier)} competing in {player.gamemode}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-yellow-300/20 bg-black/35 px-6 py-4 text-right yellow-glow">
                <div className="text-xs uppercase tracking-[0.24em] text-yellow-100/45">Total points</div>
                <div className="font-mono text-5xl font-black text-yellow-200">{player.points.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-4 sm:p-8">
            <Metric label="Mode rank" value={standing ? `#${standing}` : "--"} />
            <Metric label="Region" value={player.region} />
            <Metric label="Gamemode" value={player.gamemode} />
            <Metric label="Tier score" value={tierScore(player.tier).toString()} />
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function AdminPage() {
  const { players, loading, error } = usePlayers();
  const { applications, loading: applicationsLoading, error: applicationsError } = useApplications();
  const { teamMembers, loading: teamLoading, error: teamError } = useTeamMembers();
  const { user, isLoaded } = useUser();
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.points - a.points), [players]);
  const sortedApplications = useMemo(() => [...applications].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")), [applications]);
  const sortedTeam = useMemo(() => {
    const roleOrder: Record<TeamRole, number> = { Owner: 0, Leader: 1, Staff: 2 };
    return [...teamMembers].sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name));
  }, [teamMembers]);
  const currentEmail = user?.primaryEmailAddress?.emailAddress.toLowerCase();
  const isAdmin = Boolean(currentEmail && allowedAdminEmails.includes(currentEmail));

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = {
      name: form.name.trim(),
      tier: form.tier,
      gamemode: form.gamemode,
      points: Number(form.points) || 0,
      region: form.region.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (!payload.name || !payload.region) throw new Error("Name and region are required.");
      if (editingId) {
        await updateDoc(doc(db, "players", editingId), payload);
        setMessage("Player updated in Firebase.");
      } else {
        await addDoc(collection(db, "players"), { ...payload, createdAt: serverTimestamp() });
        setMessage("Player added to Firebase.");
      }
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save player.");
    } finally {
      setSaving(false);
    }
  }

  function editPlayer(player: Player) {
    setEditingId(player.id);
    setForm({ name: player.name, tier: player.tier, gamemode: player.gamemode, points: String(player.points), region: player.region });
  }

  async function removePlayer(player: Player) {
    setMessage(null);
    try {
      await deleteDoc(doc(db, "players", player.id));
      if (editingId === player.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setMessage(`${player.name} deleted from Firebase.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete player.");
    }
  }

  async function updateApplicationStatus(application: TierApplication, status: string) {
    try {
      await updateDoc(doc(db, "tierApplications", application.id), { status, updatedAt: serverTimestamp() });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update application.");
    }
  }

  async function removeApplication(application: TierApplication) {
    try {
      await deleteDoc(doc(db, "tierApplications", application.id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete application.");
    }
  }

  async function submitTeamMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTeam(true);
    setTeamMessage(null);

    try {
      if (!teamForm.name.trim()) throw new Error("Name is required.");
      await addDoc(collection(db, "teamMembers"), {
        name: teamForm.name.trim(),
        role: teamForm.role,
        discord: teamForm.discord.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTeamForm(emptyTeamForm);
      setTeamMessage("Team member added.");
    } catch (err) {
      setTeamMessage(err instanceof Error ? err.message : "Unable to add team member.");
    } finally {
      setSavingTeam(false);
    }
  }

  async function removeTeamMember(member: TeamMember) {
    try {
      await deleteDoc(doc(db, "teamMembers", member.id));
      setTeamMessage(`${member.name} removed.`);
    } catch (err) {
      setTeamMessage(err instanceof Error ? err.message : "Unable to remove team member.");
    }
  }

  if (isLoaded && user && !isAdmin) {
    return (
      <Shell>
        <div className="glass-panel mx-auto mt-16 max-w-2xl rounded-[2rem] p-8 text-center">
          <div className="mb-4 inline-flex rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-red-200">Access blocked</div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-yellow-50">This account is not an admin.</h1>
          <p className="mt-4 text-yellow-50/55">Only voidfury1527@gmail.com can add, edit, or delete tier-list players.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-yellow-300 px-6 py-3 font-black text-black shadow-[0_0_28px_rgba(255,217,61,.25)] transition hover:bg-yellow-200">Return to leaderboard</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Show when="signed-out">
        <div className="glass-panel mx-auto mt-16 max-w-2xl rounded-[2rem] p-8 text-center">
          <div className="mb-4 inline-flex rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Admin only</div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-yellow-50">Sign in to manage rankings.</h1>
          <p className="mt-4 text-yellow-50/55">The public leaderboard is open, but adding, editing, and deleting player tiers requires admin access.</p>
          <Link href="/sign-in" className="mt-6 inline-flex rounded-full bg-yellow-300 px-6 py-3 font-black text-black shadow-[0_0_28px_rgba(255,217,61,.25)] transition hover:bg-yellow-200">Open admin sign in</Link>
        </div>
      </Show>
      <Show when="signed-in">
        <section className="grid gap-6 py-10 lg:grid-cols-[.82fr_1.18fr]">
          <form onSubmit={submitForm} className="glass-panel rounded-[2rem] p-6">
            <div className="mb-6">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Admin panel</div>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-yellow-50">{editingId ? "Edit player" : "Add player"}</h1>
              <p className="mt-2 text-sm text-yellow-50/48">Every save writes directly to Firebase and updates the public list in realtime.</p>
            </div>
            <div className="space-y-4">
              <Field label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" placeholder="Minecraft username" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tier"><select value={form.tier} onChange={(event) => setForm({ ...form, tier: event.target.value as Tier })} className="admin-input">{tiers.map((tier) => <option key={tier}>{tier}</option>)}</select></Field>
                <Field label="Gamemode"><select value={form.gamemode} onChange={(event) => setForm({ ...form, gamemode: event.target.value as Gamemode })} className="admin-input">{gamemodes.map((mode) => <option key={mode}>{mode}</option>)}</select></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Points"><input type="number" min="0" value={form.points} onChange={(event) => setForm({ ...form, points: event.target.value })} className="admin-input" /></Field>
                <Field label="Region"><input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="admin-input" placeholder="NA, EU, AS, OCE" /></Field>
              </div>
              {message ? <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-100">{message}</div> : null}
              <div className="flex gap-3">
                <button disabled={saving} className="flex-1 rounded-2xl bg-yellow-300 px-5 py-3 font-black text-black transition hover:bg-yellow-200 disabled:opacity-50">{saving ? "Saving" : editingId ? "Save changes" : "Add player"}</button>
                {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-2xl border border-yellow-300/20 px-5 py-3 font-bold text-yellow-100 transition hover:bg-yellow-300/10">Cancel</button> : null}
              </div>
            </div>
          </form>

          <div className="glass-panel rounded-[2rem] p-4 sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Database roster</div>
                <h2 className="mt-1 text-2xl font-black text-yellow-50">{players.length} players</h2>
              </div>
              {loading ? <div className="text-sm text-yellow-50/45">Syncing</div> : null}
            </div>
            {error ? <EmptyState title="Firebase connection issue" message={error} /> : null}
            <div className="space-y-3">
              {sortedPlayers.map((player) => (
                <div key={player.id} className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <PlayerAvatar name={player.name} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-black text-yellow-50">{player.name}</span><TierBadge tier={player.tier} /></div>
                    <div className="mt-1 text-sm text-yellow-50/50">{player.gamemode} / {player.region} / {player.points.toLocaleString()} points</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editPlayer(player)} className="rounded-xl border border-yellow-300/20 px-4 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/10">Edit</button>
                    <button onClick={() => removePlayer(player)} className="rounded-xl border border-red-400/25 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
              ))}
              {!loading && sortedPlayers.length === 0 ? <EmptyState title="No players in Firebase" message="Add the first player to start building the live tier list." /> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="glass-panel rounded-[2rem] p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Tier test inbox</div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-yellow-50">{applications.length} applications</h2>
              </div>
              {applicationsLoading ? <div className="text-sm text-yellow-50/45">Syncing</div> : null}
            </div>
            {applicationsError ? <EmptyState title="Application sync issue" message={applicationsError} /> : null}
            <div className="space-y-3">
              {sortedApplications.map((application) => (
                <div key={application.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-black text-yellow-50">{application.username}</span>
                        <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-200">{application.status}</span>
                      </div>
                      <div className="mt-2 text-sm text-yellow-50/55">{application.discord} / {application.gamemode} / {application.region}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateApplicationStatus(application, "accepted")} className="rounded-xl border border-green-400/25 px-3 py-2 text-sm font-bold text-green-200 transition hover:bg-green-500/10">Accept</button>
                      <button onClick={() => updateApplicationStatus(application, "reviewing")} className="rounded-xl border border-yellow-300/25 px-3 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/10">Review</button>
                      <button onClick={() => updateApplicationStatus(application, "rejected")} className="rounded-xl border border-red-400/25 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/10">Reject</button>
                      <button onClick={() => removeApplication(application)} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-yellow-50/65 transition hover:bg-white/5">Delete</button>
                    </div>
                  </div>
                  <p className="mt-3 rounded-2xl border border-yellow-300/10 bg-black/30 p-3 text-sm leading-6 text-yellow-50/65">{application.experience}</p>
                </div>
              ))}
              {!applicationsLoading && sortedApplications.length === 0 ? <EmptyState title="No tier-test applications" message="When players apply from the homepage, their requests will appear here." /> : null}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-5">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">Team roles</div>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-yellow-50">Owner, leader, staff</h2>
              <p className="mt-2 text-sm text-yellow-50/45">These entries show publicly on the homepage.</p>
            </div>
            <form onSubmit={submitTeamMember} className="space-y-4">
              <Field label="Name"><input value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} className="admin-input" placeholder="Staff name" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Role"><select value={teamForm.role} onChange={(event) => setTeamForm({ ...teamForm, role: event.target.value as TeamRole })} className="admin-input">{teamRoles.map((role) => <option key={role}>{role}</option>)}</select></Field>
                <Field label="Discord"><input value={teamForm.discord} onChange={(event) => setTeamForm({ ...teamForm, discord: event.target.value })} className="admin-input" placeholder="futureboy#1527" /></Field>
              </div>
              {teamMessage ? <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-100">{teamMessage}</div> : null}
              <button disabled={savingTeam} className="w-full rounded-2xl bg-yellow-300 px-5 py-3 font-black text-black transition hover:bg-yellow-200 disabled:opacity-50">{savingTeam ? "Adding" : "Add team member"}</button>
            </form>
            <div className="mt-5 space-y-3">
              {teamError ? <EmptyState title="Team sync issue" message={teamError} /> : null}
              {teamLoading ? <div className="text-sm text-yellow-50/45">Syncing team</div> : null}
              {sortedTeam.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div>
                    <div className="font-black text-yellow-50">{member.name}</div>
                    <div className="text-sm text-yellow-50/50">{member.role} / {member.discord || "No Discord"}</div>
                  </div>
                  <button onClick={() => removeTeamMember(member)} className="rounded-xl border border-red-400/25 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/10">Remove</button>
                </div>
              ))}
              {!teamLoading && sortedTeam.length === 0 ? <div className="rounded-2xl border border-dashed border-yellow-300/18 bg-black/25 p-4 text-sm text-yellow-50/50">No team members added yet.</div> : null}
            </div>
          </div>
        </section>
      </Show>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-yellow-100/45">{label}</span>
      {children}
    </label>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-bold text-yellow-200/80 hover:text-yellow-100">Back to leaderboard</Link>
        </div>
        {/* To update login providers, app branding, or OAuth settings use the Auth pane in the workspace toolbar. More information can be found in the Replit docs. */}
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-bold text-yellow-200/80 hover:text-yellow-100">Back to leaderboard</Link>
        </div>
        {/* To update login providers, app branding, or OAuth settings use the Auth pane in the workspace toolbar. More information can be found in the Replit docs. */}
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LeaderboardPage} />
      <Route path="/player/:id" component={PlayerProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route><Redirect to="/" /></Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} localization={{ signIn: { start: { title: "Admin access", subtitle: "Sign in to manage mcasiantiers rankings" } }, signUp: { start: { title: "Create admin account", subtitle: "Join the control room for tier updates" } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
      <QueryClientProvider client={queryClient}>
        <ClerkCacheInvalidator />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
