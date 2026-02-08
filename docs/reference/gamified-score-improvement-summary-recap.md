  ---
  Score Improvement Celebration Pattern: Implementation Reference

  This documents the complete "re-score and celebrate" pattern — how to take a scored entity, apply changes, recalculate the score, and show the user a compelling gamified animation
  experience. Written to be portable across any product with a similar "enrich/improve a thing and show the delta" mechanic.

  ---
  1. The Core Loop (Data Flow)

  User applies changes
      → API captures previousScore BEFORE mutations
      → Apply changes in a database transaction
      → Recalculate newScore after all mutations
      → Return { previousScore, newScore, changesSummary } to client
      → Client fetches ranking data (optional, parallel)
      → Client sets celebrationData state → celebration component renders
      → Timed animation sequence plays out
      → User manually dismisses → router.refresh() to sync UI

  The critical detail: You must capture previousScore before touching the database. The score delta is calculated server-side and returned in the API response — never estimated on the
  client.

  // In your apply API route
  const previousScore = entity.currentScore;

  // ... apply all changes in a transaction ...

  const newScore = calculateScore(updatedEntity);
  await db.entity.update({ data: { score: newScore } });

  return { previousScore, newScore, changesSummary };

  ---
  2. Animation Architecture: Phase-Based State Machine

  The master celebration component uses a single phase state variable (not scattered booleans) to control a timed reveal sequence:

  type AnimationPhase =
    | "initial"         // Component just mounted
    | "score-animating" // Progress bar filling
    | "score-complete"  // Score landed, sound plays
    | "rank-reveal"     // Relative ranking shown
    | "summary"         // What changed revealed
    | "complete";       // CTAs appear, user can interact

  Derived booleans control visibility:

  const showScoreBar = phase !== "initial";
  const showDelta    = ["score-complete", "rank-reveal", "summary", "complete"].includes(phase);
  const showRank     = ["rank-reveal", "summary", "complete"].includes(phase);
  const showSummary  = ["summary", "complete"].includes(phase);
  const showCTAs     = phase === "complete";

  This is cleaner than independent useState booleans because every element's visibility is deterministic from one state value, and the timeline is a single useEffect:

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setPhase("score-animating"), 300));
    timers.push(setTimeout(() => {
      setPhase("score-complete");
      playScoreComplete();          // audio cue at score landing
    }, 1800));
    timers.push(setTimeout(() => {
      setPhase("rank-reveal");
      playRankReveal();             // second audio cue
    }, 2300));
    timers.push(setTimeout(() => setPhase("summary"), 2800));
    timers.push(setTimeout(() => setPhase("complete"), 3200));

    return () => timers.forEach(clearTimeout);
  }, [playScoreComplete, playRankReveal]);

  Total timeline: ~3.2 seconds from mount to interactive. Each phase transition reveals the next layer.

  There's also a simpler variant used in a different context (inline celebration after applying research). This one uses independent boolean states and named delay constants instead of
   a phase enum:

  const SCORE_ANIMATION_DURATION = 1500;
  const RANK_DELAY = 2000;
  const CHANGES_DELAY = 2500;

  useEffect(() => {
    setIsAnimating(true);
    const deltaTimer = setTimeout(() => setShowDelta(true), SCORE_ANIMATION_DURATION);
    const rankTimer = setTimeout(() => setShowRank(true), RANK_DELAY);
    const changesTimer = setTimeout(() => setShowChanges(true), CHANGES_DELAY);
    return () => { clearTimeout(deltaTimer); clearTimeout(rankTimer); clearTimeout(changesTimer); };
  }, []);

  The simpler variant works for a less complex celebration (fewer elements to orchestrate).

  ---
  3. The Score Bar: Spring Physics + Number Ticker

  Two independent animation systems run in parallel for the score:

  Progress Bar (Framer Motion spring):

  import { useSpring, useTransform, motion } from "framer-motion";

  const springValue = useSpring(previousScore, {
    stiffness: 50,   // low = slower, more elastic fill
    damping: 20,     // moderate = slight overshoot, organic feel
  });

  const width = useTransform(springValue, [0, 100], ["0%", "100%"]);

  useEffect(() => {
    if (isAnimating) springValue.set(newScore);
  }, [isAnimating, newScore, springValue]);

  <motion.div style={{ width }} className="h-full rounded-full" />

  The bar uses a multi-zone color gradient that maps score ranges to colors:

  function getGradientStops(endScore: number): string {
    // Builds a CSS gradient: red(0-25) → orange(25-50) → amber(50-75) → green(75-100)
    // Only extends to the zones covered by the endScore
  }

  So as the bar fills, it visually transitions through color zones — red to orange to green — giving a visceral sense of "health bar filling up."

  Number Counter (requestAnimationFrame):

  Uses RAF directly (not Framer Motion) for precise 60fps number animation with ease-out quadratic easing:

  const animate = (timestamp: number) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) * (1 - progress);  // ease-out quad
    const current = Math.round(from + (to - from) * eased);
    setDisplayValue(current);
    if (progress < 1) requestAnimationFrame(animate);
  };

  The deceleration curve is key — the number counts up fast initially, then slows as it approaches the target. Duration: 1500ms. This is a simple <span> component with from, to, and
  optional duration props.

  Delta Badge: After the animation completes, a small badge fades in showing +N:

  {showDelta && delta > 0 && (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        backgroundColor: `${scoreColor}20`,  // 20 = ~12% opacity hex
        color: scoreColor,
      }}
    >
      +{delta}
    </motion.span>
  )}

  ---
  4. Ranking/Leaderboard Celebration (Tiered Messaging)

  After the score animation, an achievement card reveals with context-aware messaging. The component calculates rankDelta = previousRank - currentRank and selects the highest
  applicable tier:

  | Condition          | Icon       | Color       | Message Pattern                         |
  |--------------------|------------|-------------|-----------------------------------------|
  | Rank #1            | Trophy     | Gold/yellow | "is now your most [enriched/complete]!" |
  | Entered Top 3      | Star       | Purple      | "just cracked your Top 3!"              |
  | Entered Top 10     | Flame      | Orange      | "just entered your Top 10!"             |
  | Stayed in Top 10   | Flame      | Amber       | "stays in your Top 10!"                 |
  | Jumped 50+ spots   | TrendingUp | Amber       | "moved from #X to #Y!"                  |
  | Jumped 10-50 spots | TrendingUp | Amber       | "moved up N spots to #Y!"               |
  | Small improvement  | TrendingUp | Amber       | "moved up to #Y of Z"                   |
  | No change          | —          | —           | Hidden (returns null)                   |

  The ranking is calculated server-side by sorting all entities by score descending and finding the position. The previous rank is estimated from the previous score (how many entities
  had a higher score than the old score).

  Animation: Wrapped by parent in AnimatePresence with spring entry:

  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >

  ---
  5. Sound Design: Synthesized Web Audio Chimes

  No audio files. Sounds are synthesized at runtime using the Web Audio API, producing a meditation bowl / Chinese bell quality:

  const playChime = (frequencies: number[], duration = 0.8) => {
    const ctx = audioContext;
    const now = ctx.currentTime;

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";                                    // soft, round tone
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);  // 20ms attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // bell-like decay

      const delay = i * 0.08;                               // 80ms arpeggio spacing
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    });
  };

  Two chords, two moments:

  | Sound          | Frequencies             | Musical Notes        | Duration | Triggered At          |
  |----------------|-------------------------|----------------------|----------|-----------------------|
  | Score Complete | 523.25, 659.25, 783.99  | C5, E5, G5 (C major) | 1.0s     | 1800ms (score lands)  |
  | Rank Reveal    | 783.99, 987.77, 1174.66 | G5, B5, D6 (higher)  | 1.2s     | 2300ms (rank appears) |

  Mobile compatibility: AudioContext is initialized lazily on first click/touchstart (browser autoplay policy). Suspended contexts are resumed before playback.

  Key design parameters:
  - Volume: 0.15 max (subtle, not startling)
  - Attack: 20ms linear ramp (crisp start)
  - Decay: Exponential to 0.001 (natural ring-out)
  - Wave: Sine (no harmonics = clean bell tone)

  ---
  6. Framer Motion Patterns Used

  | Pattern          | Props                                                                                                      | Use Case                 |
  |------------------|------------------------------------------------------------------------------------------------------------|--------------------------|
  | Spring pop       | initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} | Success icon, badges     |
  | Fade + slide     | initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}                                             | Text, containers, CTAs   |
  | Scale + fade     | initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}                                    | Delta badge, streak      |
  | Staggered reveal | Same fade+slide with transition={{ delay: index * 0.1 }}                                                   | List items               |
  | Spring fill      | useSpring(start, { stiffness: 50, damping: 20 }) → useTransform(spring, [0, 100], ["0%", "100%"])          | Progress bar             |
  | Container exit   | Wrapped in <AnimatePresence> with exit={{ opacity: 0 }}                                                    | All phase-gated elements |

  Every phase-gated element is wrapped in <AnimatePresence> so unmounting is animated too.

  ---
  7. Dismissal & State Sync

  The celebration is never auto-dismissed. The user must acknowledge it. On dismiss:

  const handleDismiss = () => {
    setCelebrationData(null);   // unmounts the celebration
    router.refresh();           // rehydrate server data into the page
  };

  The router.refresh() is critical — it forces Next.js to re-fetch server components with the new score, so the rest of the page (score cards, ranking badges) updates to match what the
   celebration just showed.

  ---
  8. Dependencies

  | Library               | Role                                               | Version (approx) |
  |-----------------------|----------------------------------------------------|------------------|
  | framer-motion         | Spring physics, AnimatePresence, motion components | ^12.x            |
  | lucide-react          | Icons (Trophy, Flame, Star, TrendingUp, Sparkles)  | ^0.5x            |
  | Web Audio API         | Sound synthesis (no npm package)                   | Browser native   |
  | requestAnimationFrame | Number ticker animation                            | Browser native   |

  No confetti library. No audio files. The entire celebration is built with Framer Motion + vanilla Web Audio + RAF.

  ---
  9. Portable Pattern Summary

  To reproduce this in another product:

  1. Server: Capture previousScore before mutations. Recalculate after. Return both + change summary.
  2. Client: Store celebrationData state. Populate it from the API response (plus optional ranking fetch).
  3. Orchestrator component: Use a phase enum or named timeouts to stage reveals over ~3 seconds.
  4. Score bar: Framer Motion useSpring (stiffness: 50, damping: 20) for the fill + custom RAF NumberTicker for the counter.
  5. Color zones: Map score ranges to a gradient (red → orange → amber → green) that fills as the bar grows.
  6. Ranking card: Tier-based messaging with escalating icon/color based on relative position change.
  7. Sound: Web Audio API sine oscillators with 80ms arpeggio spacing, 0.15 max gain, exponential decay. Two chords at two milestones.
  8. Dismiss: Manual only. Then router.refresh() to sync the page with the new server state.
