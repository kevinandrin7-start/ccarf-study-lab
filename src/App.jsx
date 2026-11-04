import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen, Timer, LayoutGrid, BarChart3, Sun, Moon, Monitor, Flag, Check, X,
  ChevronLeft, ChevronRight, RotateCcw, Shuffle, Eye, Target, Trophy, AlertTriangle,
  Layers, Cpu, MessageSquareText, Wrench, SlidersHorizontal, Network, ShieldCheck,
  Play, BookMarked, Clock, ListChecks, GraduationCap, Info, ArrowRight, Trash2,
  Library, CircleCheck, Lightbulb,
} from "lucide-react";
import { DOMAINS, QUESTIONS } from "./questions.js";
import { STUDY_GUIDE, EXAM_TIPS } from "./studyGuide.js";

/* ------------------------------------------------------------------ */
/* Persistence: localStorage when available, in-memory fallback        */
/* ------------------------------------------------------------------ */
const STORE_KEY = "ccarf-prep-v1";
const EXAM_KEY = "ccarf-active-exam-v1";
const memory = {};
const storage = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch (e) { /* blocked storage: fall through to memory */ }
    return key in memory ? memory[key] : fallback;
  },
  set(key, value) {
    memory[key] = value;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  },
  remove(key) {
    delete memory[key];
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  },
};

const EMPTY_PROGRESS = { attempts: {}, exams: [], focus: DOMAINS.map((d) => d.id), theme: "system", studied: {} };

function useProgress() {
  const [progress, setProgress] = useState(() => ({ ...EMPTY_PROGRESS, ...storage.get(STORE_KEY, {}) }));
  useEffect(() => { storage.set(STORE_KEY, progress); }, [progress]);

  const recordAttempt = useCallback((qid, correct) => {
    setProgress((p) => {
      const prev = p.attempts[qid] || { seen: 0, correct: 0, last: null };
      return {
        ...p,
        attempts: { ...p.attempts, [qid]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0), last: correct } },
      };
    });
  }, []);

  return { progress, setProgress, recordAttempt };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const LETTERS = ["A", "B", "C", "D"];
const DOMAIN_ICONS = { models: Cpu, prompting: MessageSquareText, tools: Wrench, api: SlidersHorizontal, architecture: Network, safety: ShieldCheck };
const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const questionById = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const PASS_PCT = 75;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// A random option order per question, so the correct letter isn't predictable.
function makeOrders(ids) {
  return Object.fromEntries(ids.map((id) => [id, shuffle([0, 1, 2, 3])]));
}
function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function cx(...c) { return c.filter(Boolean).join(" "); }

function domainStats(attempts) {
  const out = Object.fromEntries(DOMAINS.map((d) => [d.id, { seen: 0, correct: 0, mastered: 0, total: 0 }]));
  QUESTIONS.forEach((q) => {
    const s = out[q.domain];
    s.total += 1;
    const a = attempts[q.id];
    if (a) { s.seen += a.seen; s.correct += a.correct; if (a.last) s.mastered += 1; }
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */
function Button({ variant = "primary", className, children, ...rest }) {
  const styles = {
    primary: "bg-accent text-onaccent hover:opacity-90",
    secondary: "bg-surface2 text-ink hover:bg-line",
    ghost: "text-muted hover:text-ink hover:bg-surface2",
    danger: "bg-bad text-onaccent hover:opacity-90",
  };
  return (
    <button
      className={cx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

function DomainTag({ id }) {
  const Icon = DOMAIN_ICONS[id];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-accentsoft px-2 py-1 text-xs font-semibold text-accent">
      <Icon size={13} aria-hidden="true" />{domainById[id].short}
    </span>
  );
}

function Bar({ value, tone = "accent" }) {
  const color = { accent: "bg-accent", good: "bg-good", bad: "bg-bad", warn: "bg-warn" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2" role="presentation">
      <div className={cx("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function toneFor(p, seen) {
  if (!seen) return "accent";
  if (p >= PASS_PCT) return "good";
  if (p >= 50) return "warn";
  return "bad";
}

function Panel({ className, children }) {
  return <section className={cx("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)}>{children}</section>;
}

/* ------------------------------------------------------------------ */
/* Option list (shared by practice, exam and review)                   */
/* ------------------------------------------------------------------ */
function OptionList({ q, order, selected, reveal, onSelect, disabled, showExplanations }) {
  return (
    <ol className="flex flex-col gap-3">
      {order.map((optIdx, pos) => {
        const isCorrect = optIdx === q.answer;
        const isSelected = selected === optIdx;
        let state = "idle";
        if (reveal) state = isCorrect ? "correct" : isSelected ? "wrong" : "dim";
        else if (isSelected) state = "selected";
        const box = {
          idle: "border-line bg-surface hover:border-accent hover:bg-accentsoft/40",
          selected: "border-accent bg-accentsoft ring-1 ring-accent",
          correct: "border-good bg-goodsoft",
          wrong: "border-bad bg-badsoft",
          dim: "border-line bg-surface",
        }[state];
        const badge = {
          idle: "bg-surface2 text-muted",
          selected: "bg-accent text-onaccent",
          correct: "bg-good text-onaccent",
          wrong: "bg-bad text-onaccent",
          dim: "bg-surface2 text-muted",
        }[state];
        return (
          <li key={optIdx}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect && onSelect(optIdx)}
              className={cx("flex w-full gap-3 rounded-xl border p-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent", box, disabled && "cursor-default")}
              aria-pressed={isSelected}
            >
              <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold", badge)}>
                {reveal && isCorrect ? <Check size={16} /> : reveal && isSelected ? <X size={16} /> : LETTERS[pos]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-relaxed text-ink">{q.options[optIdx]}</span>
                {reveal && showExplanations && (
                  <span className={cx("mt-2 block text-sm leading-relaxed", isCorrect ? "text-good" : "text-muted")}>
                    <span className="font-semibold">{isCorrect ? "Why it's right: " : "Why it's wrong: "}</span>
                    {q.explanations[optIdx]}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Takeaway({ q }) {
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-surface2 p-4">
      <p className="flex gap-2 text-sm leading-relaxed text-ink">
        <BookMarked size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <span><span className="font-semibold">Key takeaway: </span>{q.takeaway}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="label">Docs to review</span>
        {q.refs.map((r) => (
          <span key={r} className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-xs text-muted">{r}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
function Dashboard({ progress, setProgress, go, onStudy }) {
  const stats = domainStats(progress.attempts);
  const focus = progress.focus;
  const toggle = (id) => setProgress((p) => {
    const has = p.focus.includes(id);
    const next = has ? p.focus.filter((x) => x !== id) : [...p.focus, id];
    return { ...p, focus: next.length ? next : p.focus };
  });
  const focusCount = QUESTIONS.filter((q) => focus.includes(q.domain)).length;
  const totals = Object.values(stats).reduce((a, s) => ({ seen: a.seen + s.seen, correct: a.correct + s.correct, mastered: a.mastered + s.mastered }), { seen: 0, correct: 0, mastered: 0 });
  const lastExam = progress.exams[progress.exams.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <section className="blueprint relative overflow-hidden rounded-2xl border border-line p-6 sm:p-8">
        <p className="label text-accent">Claude Certified Architect · Foundations</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold leading-tight text-ink sm:text-4xl" style={{ textWrap: "balance" }}>
          Practise the architect's calls before the exam asks for them.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          A study guide for each of the {DOMAINS.length} domains, plus {QUESTIONS.length} scenario questions. Every option is explained, and every question points to the docs to review.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => go("study")}><Library size={16} />Open the study guide</Button>
          <Button variant="secondary" onClick={() => go("practice")}><BookOpen size={16} />Practise {focusCount} questions</Button>
          <Button variant="secondary" onClick={() => go("exam")}><Timer size={16} />Start a mock exam</Button>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-lg">
          <div><dt className="label">Accuracy</dt><dd className="font-display text-2xl font-bold tabular-nums text-ink">{totals.seen ? `${pct(totals.correct, totals.seen)}%` : "–"}</dd></div>
          <div><dt className="label">Mastered</dt><dd className="font-display text-2xl font-bold tabular-nums text-ink">{totals.mastered}/{QUESTIONS.length}</dd></div>
          <div><dt className="label">Last exam</dt><dd className={cx("font-display text-2xl font-bold tabular-nums", lastExam ? (lastExam.passed ? "text-good" : "text-bad") : "text-ink")}>{lastExam ? `${lastExam.pct}%` : "–"}</dd></div>
        </dl>
      </section>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Focus domains</h2>
            <p className="text-sm text-muted">Tick the domains to include in practice and mock exams.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setProgress((p) => ({ ...p, focus: DOMAINS.map((d) => d.id) }))}>Select all</Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d) => {
            const s = stats[d.id];
            const on = focus.includes(d.id);
            const Icon = DOMAIN_ICONS[d.id];
            const acc = pct(s.correct, s.seen);
            return (
              <div
                key={d.id}
                className={cx("flex flex-col gap-3 rounded-xl border p-4 text-left transition", on ? "border-accent bg-surface" : "border-line bg-surface opacity-60 hover:opacity-90")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold text-ink"><Icon size={18} className="text-accent" />{d.name}</span>
                  <button type="button" onClick={() => toggle(d.id)} aria-pressed={on} aria-label={`Include ${d.name}`} className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent", on ? "border-accent bg-accent text-onaccent" : "border-line")}>{on && <Check size={15} />}</button>
                </div>
                <p className="text-sm leading-snug text-muted">{d.blurb}</p>
                <div className="mt-auto flex flex-col gap-1.5">
                  <div className="flex justify-between font-mono text-xs text-muted">
                    <span>{s.total} questions · {s.mastered} mastered</span>
                    <span className="tabular-nums">{s.seen ? `${acc}%` : "not started"}</span>
                  </div>
                  <Bar value={s.seen ? acc : 0} tone={toneFor(acc, s.seen)} />
                </div>
                <button type="button" onClick={() => onStudy(d.id)} className="flex items-center gap-1.5 self-start text-sm font-semibold text-accent hover:underline">
                  {(progress.studied || {})[d.id] ? <CircleCheck size={15} className="text-good" /> : <Library size={15} />}
                  {(progress.studied || {})[d.id] ? "Studied · review notes" : "Study this domain"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex gap-2 rounded-xl border border-line bg-surface2 p-4 text-sm leading-relaxed text-muted">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>These are original practice questions written against the study domains for this exam. They are not official exam questions. Model names, limits and API behaviour reflect the Claude API as of November 2026, so confirm details against the current Anthropic docs before your exam.</span>
      </p>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Study guide                                                         */
/* ------------------------------------------------------------------ */
function Rich({ text }) {
  const parts = text.split("`");
  return parts.map((part, i) => (i % 2 ? <code key={i} className="rounded bg-surface2 px-1 py-0.5 font-mono text-[0.85em] text-ink">{part}</code> : <React.Fragment key={i}>{part}</React.Fragment>));
}

function StudyGuide({ progress, setProgress, onPractice, initialDomain }) {
  const [active, setActive] = useState(initialDomain || DOMAINS[0].id);
  const studied = progress.studied || {};
  const lesson = STUDY_GUIDE[active];
  const d = domainById[active];
  const Icon = DOMAIN_ICONS[active];
  const qCount = QUESTIONS.filter((q) => q.domain === active).length;
  const doneCount = DOMAINS.filter((x) => studied[x.id]).length;
  const idx = DOMAINS.findIndex((x) => x.id === active);
  const pick = (id) => { setActive(id); window.scrollTo({ top: 0 }); };
  const toggleStudied = () => setProgress((p) => ({ ...p, studied: { ...(p.studied || {}), [active]: !(p.studied || {})[active] } }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Study guide</h1>
          <p className="text-sm text-muted">Notes for each domain. Read a lesson, then practise its questions.</p>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted">{doneCount}/{DOMAINS.length} lessons studied</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Lessons" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {DOMAINS.map((x) => {
            const I = DOMAIN_ICONS[x.id];
            const on = x.id === active;
            return (
              <button key={x.id} onClick={() => pick(x.id)} aria-current={on ? "page" : undefined}
                className={cx("flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition", on ? "border-accent bg-accentsoft text-accent" : "border-line bg-surface text-muted hover:text-ink")}>
                <I size={16} className="shrink-0" />
                <span className="flex-1 whitespace-nowrap lg:whitespace-normal">{x.name}</span>
                {studied[x.id] && <CircleCheck size={16} className="shrink-0 text-good" aria-label="studied" />}
              </button>
            );
          })}
        </nav>

        <article className="flex min-w-0 flex-col gap-5">
          <Panel>
            <p className="label flex items-center gap-1.5 text-accent"><Icon size={14} />Lesson {idx + 1} of {DOMAINS.length}</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink" style={{ textWrap: "balance" }}>{d.name}</h2>
            <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted">{lesson.summary}</p>
            <div className="mt-5 rounded-xl border border-line bg-surface2 p-4">
              <p className="label mb-2">You should be able to</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {lesson.objectives.map((o) => (
                  <li key={o} className="flex gap-2 text-sm leading-snug text-ink"><Target size={15} className="mt-0.5 shrink-0 text-accent" />{o}</li>
                ))}
              </ul>
            </div>
          </Panel>

          {lesson.table && (
            <Panel className="!p-0">
              <p className="px-5 pt-5 font-display text-lg font-bold text-ink sm:px-6">{lesson.table.caption}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-y border-line bg-surface2 text-left">
                      {lesson.table.head.map((h) => <th key={h} className="label px-4 py-2 first:pl-5 sm:first:pl-6">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.table.rows.map((r) => (
                      <tr key={r[0]} className="border-b border-line align-top last:border-0">
                        {r.map((c, i) => <td key={i} className={cx("px-4 py-2.5 leading-snug first:pl-5 sm:first:pl-6", i === 0 ? "min-w-[120px] font-semibold text-ink" : "text-muted", (/\$/.test(c) || c.startsWith("`")) && "whitespace-nowrap", /\$/.test(c) && "font-mono tabular-nums", i === r.length - 1 && "min-w-[220px]")}><Rich text={c} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lesson.table.note && <p className="px-5 pb-5 pt-3 text-xs leading-relaxed text-muted sm:px-6">{lesson.table.note}</p>}
            </Panel>
          )}

          {lesson.sections.map((sec) => (
            <Panel key={sec.title}>
              <h3 className="font-display text-lg font-bold text-ink">{sec.title}</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {sec.points.map((pt, i) => (
                  <li key={i} className="flex max-w-[72ch] gap-2.5 text-[15px] leading-relaxed text-ink">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    <span className="min-w-0"><Rich text={pt} /></span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}

          <section className="rounded-2xl border border-warn/40 bg-warnsoft p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink"><AlertTriangle size={18} className="text-warn" />Common traps</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {lesson.traps.map((t) => (
                <li key={t} className="flex gap-2 text-[15px] leading-relaxed text-ink"><X size={16} className="mt-1 shrink-0 text-warn" /><span><Rich text={t} /></span></li>
              ))}
            </ul>
          </section>

          <Panel className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onPractice(active)}><BookOpen size={16} />Practise {qCount} {d.short} questions</Button>
              <Button variant="secondary" onClick={toggleStudied} aria-pressed={!!studied[active]}>
                <CircleCheck size={16} className={studied[active] ? "text-good" : ""} />{studied[active] ? "Studied" : "Mark as studied"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={idx === 0} onClick={() => pick(DOMAINS[idx - 1].id)}><ChevronLeft size={16} />Previous</Button>
              <Button variant="ghost" disabled={idx === DOMAINS.length - 1} onClick={() => pick(DOMAINS[idx + 1].id)}>Next lesson<ChevronRight size={16} /></Button>
            </div>
          </Panel>

          <Panel>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink"><Lightbulb size={18} className="text-accent" />Exam technique</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {EXAM_TIPS.map((t) => (
                <li key={t} className="flex max-w-[72ch] gap-2.5 text-[15px] leading-relaxed text-ink">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />{t}
                </li>
              ))}
            </ul>
          </Panel>
        </article>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Practice / flashcards                                               */
/* ------------------------------------------------------------------ */
function Practice({ progress, recordAttempt, initialDomain }) {
  const [domains, setDomains] = useState(() => (initialDomain ? [initialDomain] : progress.focus));
  const [mode, setMode] = useState("quiz"); // quiz | flash
  const [missedOnly, setMissedOnly] = useState(false);
  const [seed, setSeed] = useState(0);

  const deck = useMemo(() => {
    let qs = QUESTIONS.filter((q) => domains.includes(q.domain));
    if (missedOnly) qs = qs.filter((q) => progress.attempts[q.id] && progress.attempts[q.id].last === false);
    return seed ? shuffle(qs) : qs;
    // progress intentionally excluded so the deck doesn't reshuffle after each answer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domains, missedOnly, seed]);
  const orders = useMemo(() => makeOrders(QUESTIONS.map((q) => q.id)), [seed]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState(false);

  useEffect(() => { setIdx(0); }, [deck]);
  useEffect(() => { setSelected(null); setRevealed(false); setGraded(false); }, [idx, deck, mode]);

  const q = deck[idx];
  const toggleDomain = (id) => setDomains((ds) => {
    const next = ds.includes(id) ? ds.filter((x) => x !== id) : [...ds, id];
    return next.length ? next : ds;
  });

  const choose = (optIdx) => {
    if (revealed) return;
    setSelected(optIdx);
    setRevealed(true);
    setGraded(true);
    recordAttempt(q.id, optIdx === q.answer);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">Practice</h1>
          <div className="flex rounded-lg border border-line bg-surface p-1" role="tablist" aria-label="Practice mode">
            {[["quiz", "Quiz", ListChecks], ["flash", "Flashcards", Layers]].map(([id, label, Icon]) => (
              <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={cx("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition", mode === id ? "bg-accent text-onaccent" : "text-muted hover:text-ink")}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => {
            const on = domains.includes(d.id);
            const Icon = DOMAIN_ICONS[d.id];
            return (
              <button key={d.id} onClick={() => toggleDomain(d.id)} aria-pressed={on} className={cx("flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition", on ? "border-accent bg-accentsoft text-accent" : "border-line text-muted hover:text-ink")}>
                <Icon size={14} />{d.short}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setSeed((s) => s + 1)}><Shuffle size={15} />Shuffle</Button>
          <Button variant="ghost" onClick={() => setMissedOnly((m) => !m)} aria-pressed={missedOnly} className={missedOnly ? "!text-bad" : ""}>
            <Target size={15} />{missedOnly ? "Showing missed only" : "Missed only"}
          </Button>
        </div>
      </div>

      {!q ? (
        <Panel className="text-center">
          <p className="font-semibold text-ink">No questions match this filter.</p>
          <p className="mt-1 text-sm text-muted">{missedOnly ? "You haven't missed any questions in these domains yet. Turn off 'Missed only' to see all of them." : "Select at least one domain."}</p>
        </Panel>
      ) : (
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <DomainTag id={q.domain} />
              <span className="font-mono text-xs text-muted">{q.difficulty}</span>
            </div>
            <span className="font-mono text-xs tabular-nums text-muted">Card {idx + 1} of {deck.length}</span>
          </div>
          <p className="max-w-[68ch] text-[17px] font-medium leading-relaxed text-ink">{q.q}</p>

          <div className="mt-5">
            {mode === "quiz" ? (
              <>
                <OptionList q={q} order={orders[q.id]} selected={selected} reveal={revealed} onSelect={choose} disabled={revealed} showExplanations />
                {!revealed && (
                  <div className="mt-4">
                    <Button variant="ghost" onClick={() => setRevealed(true)}><Eye size={15} />Reveal answer (not scored)</Button>
                  </div>
                )}
                {revealed && graded && (
                  <p className={cx("mt-4 flex items-center gap-2 font-semibold", selected === q.answer ? "text-good" : "text-bad")}>
                    {selected === q.answer ? <><Check size={18} />Correct</> : <><X size={18} />Not quite. The correct answer is highlighted.</>}
                  </p>
                )}
                {revealed && <Takeaway q={q} />}
              </>
            ) : (
              <>
                {!revealed ? (
                  <button onClick={() => setRevealed(true)} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line p-8 text-muted transition hover:border-accent hover:text-accent">
                    <Eye size={22} />
                    <span className="font-semibold">Decide your answer, then reveal it</span>
                  </button>
                ) : (
                  <>
                    <OptionList q={q} order={orders[q.id]} selected={null} reveal disabled showExplanations />
                    <Takeaway q={q} />
                    {!graded ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted">Did you have it?</span>
                        <Button variant="secondary" onClick={() => { recordAttempt(q.id, true); setGraded(true); }}><Check size={15} className="text-good" />I knew it</Button>
                        <Button variant="secondary" onClick={() => { recordAttempt(q.id, false); setGraded(true); }}><X size={15} className="text-bad" />I missed it</Button>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted">Saved to your progress.</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}><ChevronLeft size={16} />Previous</Button>
            <Button onClick={() => setIdx((i) => (i + 1) % deck.length)}>{idx === deck.length - 1 ? "Back to first" : "Next"}<ChevronRight size={16} /></Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mock exam                                                           */
/* ------------------------------------------------------------------ */
function ExamSetup({ focus, onStart }) {
  const available = QUESTIONS.filter((q) => focus.includes(q.domain)).length;
  const counts = [10, 15, 20].filter((n) => n < available).concat([available]);
  const [count, setCount] = useState(counts.includes(20) ? 20 : available);
  const [minutes, setMinutes] = useState(30);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold text-ink">Mock exam</h1>
      <Panel>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="label mb-2">Questions</p>
            <div className="flex flex-wrap gap-2">
              {counts.map((n) => (
                <button key={n} onClick={() => setCount(n)} aria-pressed={count === n} className={cx("rounded-lg border px-4 py-2 font-mono text-sm font-semibold tabular-nums transition", count === n ? "border-accent bg-accentsoft text-accent" : "border-line text-muted hover:text-ink")}>
                  {n === available ? `All ${n}` : n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-2">Time limit</p>
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60].map((m) => (
                <button key={m} onClick={() => setMinutes(m)} aria-pressed={minutes === m} className={cx("rounded-lg border px-4 py-2 font-mono text-sm font-semibold tabular-nums transition", minutes === m ? "border-accent bg-accentsoft text-accent" : "border-line text-muted hover:text-ink")}>
                  {m} min
                </button>
              ))}
            </div>
          </div>
        </div>
        <ul className="mt-6 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li className="flex gap-2"><Target size={16} className="mt-0.5 shrink-0 text-accent" />Passing score: {PASS_PCT}%</li>
          <li className="flex gap-2"><Shuffle size={16} className="mt-0.5 shrink-0 text-accent" />Questions and answer options are randomised</li>
          <li className="flex gap-2"><Flag size={16} className="mt-0.5 shrink-0 text-accent" />Flag questions to come back to before submitting</li>
          <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-accent" />The exam submits itself when time runs out</li>
        </ul>
        <p className="mt-4 text-sm text-muted">Drawing from: {focus.map((id) => domainById[id].short).join(", ")}. Change this on the Dashboard.</p>
        <div className="mt-6">
          <Button onClick={() => onStart(count, minutes)}><Play size={16} />Start exam</Button>
        </div>
      </Panel>
    </div>
  );
}

function ExamRunner({ exam, setExam, onSubmit }) {
  const [now, setNow] = useState(Date.now());
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const remaining = (exam.endsAt - now) / 1000;
  const submittedRef = useRef(false);
  useEffect(() => {
    if (remaining <= 0 && !submittedRef.current) { submittedRef.current = true; onSubmit(true); }
  }, [remaining, onSubmit]);

  const qid = exam.ids[exam.current];
  const q = questionById[qid];
  const answeredCount = exam.ids.filter((id) => exam.answers[id] != null).length;
  const flaggedCount = exam.ids.filter((id) => exam.flags[id]).length;
  const update = (patch) => setExam((e) => ({ ...e, ...patch }));
  const low = remaining < 300;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <span className="font-mono text-sm tabular-nums text-muted">Question {exam.current + 1}/{exam.ids.length} · {answeredCount} answered · {flaggedCount} flagged</span>
        <span className={cx("flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-lg font-bold tabular-nums", low ? "bg-badsoft text-bad" : "bg-surface2 text-ink")} aria-live="off">
          <Timer size={18} />{fmtTime(remaining)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <Panel className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <DomainTag id={q.domain} />
            <Button variant={exam.flags[qid] ? "secondary" : "ghost"} onClick={() => update({ flags: { ...exam.flags, [qid]: !exam.flags[qid] } })} aria-pressed={!!exam.flags[qid]} className={exam.flags[qid] ? "!text-warn" : ""}>
              <Flag size={15} fill={exam.flags[qid] ? "currentColor" : "none"} />{exam.flags[qid] ? "Flagged for review" : "Flag for review"}
            </Button>
          </div>
          <p className="max-w-[68ch] text-[17px] font-medium leading-relaxed text-ink">{q.q}</p>
          <div className="mt-5">
            <OptionList q={q} order={exam.orders[qid]} selected={exam.answers[qid]} reveal={false} onSelect={(o) => update({ answers: { ...exam.answers, [qid]: o } })} />
          </div>
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => update({ current: exam.current - 1 })} disabled={exam.current === 0}><ChevronLeft size={16} />Previous</Button>
            {exam.current < exam.ids.length - 1 ? (
              <Button onClick={() => update({ current: exam.current + 1 })}>Next<ChevronRight size={16} /></Button>
            ) : (
              <Button onClick={() => setConfirming(true)}>Review and submit<ArrowRight size={16} /></Button>
            )}
          </div>
        </Panel>

        <aside className="flex flex-col gap-4">
          <Panel className="!p-4">
            <p className="label mb-3">Question map</p>
            <div className="grid grid-cols-5 gap-1.5">
              {exam.ids.map((id, i) => {
                const answered = exam.answers[id] != null;
                return (
                  <button key={id} onClick={() => update({ current: i })} aria-label={`Question ${i + 1}${answered ? ", answered" : ""}${exam.flags[id] ? ", flagged" : ""}`}
                    className={cx("relative flex h-9 items-center justify-center rounded-md border font-mono text-xs font-semibold tabular-nums transition",
                      i === exam.current ? "border-accent ring-2 ring-accent" : "border-line",
                      answered ? "bg-accentsoft text-accent" : "bg-surface text-muted")}>
                    {i + 1}
                    {exam.flags[id] && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warn" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accentsoft" />Answered</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warn" />Flagged</span>
            </div>
          </Panel>
          <Button variant="secondary" onClick={() => setConfirming(true)}><ListChecks size={16} />Submit exam</Button>
        </aside>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h2 id="submit-title" className="font-display text-xl font-bold text-ink">Submit your exam?</h2>
            <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
              <li>{answeredCount} of {exam.ids.length} answered</li>
              {exam.ids.length - answeredCount > 0 && <li className="text-bad">{exam.ids.length - answeredCount} unanswered (scored as incorrect)</li>}
              {flaggedCount > 0 && <li className="text-warn">{flaggedCount} still flagged for review</li>}
              <li>{fmtTime(remaining)} left on the clock</li>
            </ul>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Keep working</Button>
              <Button onClick={() => { submittedRef.current = true; onSubmit(false); }}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamResults({ result, onRestart, onPractice, onStudy }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState({});
  const items = result.ids.map((id, i) => ({ id, i, q: questionById[id], picked: result.answers[id], flagged: !!result.flags[id] }));
  const shown = items.filter((it) => filter === "all" || (filter === "wrong" && it.picked !== it.q.answer) || (filter === "flagged" && it.flagged));
  const weakest = Object.entries(result.byDomain).filter(([, s]) => s.total).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];

  return (
    <div className="flex flex-col gap-5">
      <Panel className={cx("border-2", result.passed ? "border-good" : "border-bad")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={cx("label", result.passed ? "text-good" : "text-bad")}>{result.timedOut ? "Time expired · " : ""}{result.passed ? "Pass" : "Below passing score"}</p>
            <p className="mt-1 font-display text-5xl font-bold tabular-nums text-ink">{result.pct}%</p>
            <p className="mt-1 text-sm text-muted">{result.score} of {result.total} correct · passing is {PASS_PCT}% · time used {fmtTime(result.durationSec)}</p>
          </div>
          <div className={cx("flex h-16 w-16 items-center justify-center rounded-full", result.passed ? "bg-goodsoft text-good" : "bg-badsoft text-bad")}>
            {result.passed ? <Trophy size={30} /> : <AlertTriangle size={30} />}
          </div>
        </div>
        {weakest && weakest[1].correct < weakest[1].total && (
          <p className="mt-4 text-sm text-muted">Weakest domain this attempt: <span className="font-semibold text-ink">{domainById[weakest[0]].name}</span>.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onRestart}><RotateCcw size={16} />New exam</Button>
          {weakest && <Button variant="secondary" onClick={() => onPractice(weakest[0])}><BookOpen size={16} />Practise {domainById[weakest[0]].short}</Button>}
          {weakest && onStudy && <Button variant="secondary" onClick={() => onStudy(weakest[0])}><Library size={16} />Study {domainById[weakest[0]].short}</Button>}
        </div>
      </Panel>

      <Panel>
        <h2 className="font-display text-lg font-bold text-ink">Score by domain</h2>
        <div className="mt-4 flex flex-col gap-4">
          {DOMAINS.filter((d) => result.byDomain[d.id] && result.byDomain[d.id].total).map((d) => {
            const s = result.byDomain[d.id];
            const p = pct(s.correct, s.total);
            return (
              <div key={d.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium text-ink">{d.name}</span>
                  <span className="font-mono tabular-nums text-muted">{s.correct}/{s.total} · {p}%</span>
                </div>
                <Bar value={p} tone={toneFor(p, 1)} />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Review answers</h2>
          <div className="flex rounded-lg border border-line p-1">
            {[["all", "All"], ["wrong", "Incorrect"], ["flagged", "Flagged"]].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id} className={cx("rounded-md px-3 py-1 text-sm font-semibold", filter === id ? "bg-accent text-onaccent" : "text-muted hover:text-ink")}>{label}</button>
            ))}
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {shown.length === 0 && <li className="text-sm text-muted">Nothing to show for this filter.</li>}
          {shown.map(({ id, i, q, picked, flagged }) => {
            const right = picked === q.answer;
            const isOpen = !!open[id];
            return (
              <li key={id} className="rounded-xl border border-line">
                <button onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))} aria-expanded={isOpen} className="flex w-full items-start gap-3 p-4 text-left">
                  <span className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", right ? "bg-goodsoft text-good" : "bg-badsoft text-bad")}>{right ? <Check size={14} /> : <X size={14} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">Q{i + 1} · {domainById[q.domain].short}{picked == null && " · unanswered"}{flagged && <span className="text-warn">· flagged</span>}</span>
                    <span className={cx("mt-1 block text-sm leading-relaxed text-ink", !isOpen && "line-clamp-2")}>{q.q}</span>
                  </span>
                  <ChevronRight size={18} className={cx("mt-1 shrink-0 text-muted transition", isOpen && "rotate-90")} />
                </button>
                {isOpen && (
                  <div className="border-t border-line p-4">
                    <OptionList q={q} order={result.orders[id]} selected={picked} reveal disabled showExplanations />
                    <Takeaway q={q} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function MockExam({ progress, setProgress, recordAttempt, onPractice, onStudy }) {
  const [exam, setExamState] = useState(() => storage.get(EXAM_KEY, null));
  const [result, setResult] = useState(null);
  const examRef = useRef(exam);
  examRef.current = exam;
  const setExam = useCallback((fn) => {
    setExamState((e) => {
      const next = typeof fn === "function" ? fn(e) : fn;
      if (next) storage.set(EXAM_KEY, next); else storage.remove(EXAM_KEY);
      return next;
    });
  }, []);

  const start = (count, minutes) => {
    const pool = shuffle(QUESTIONS.filter((q) => progress.focus.includes(q.domain))).slice(0, count);
    const ids = pool.map((q) => q.id);
    setResult(null);
    setExam({ ids, orders: makeOrders(ids), answers: {}, flags: {}, current: 0, startedAt: Date.now(), endsAt: Date.now() + minutes * 60000, minutes });
  };

  const submit = useCallback((timedOut) => {
    const e = examRef.current;
    if (!e) return;
    examRef.current = null;
    const byDomain = {};
    let score = 0;
    e.ids.forEach((id) => {
      const q = questionById[id];
      const ok = e.answers[id] === q.answer;
      byDomain[q.domain] = byDomain[q.domain] || { correct: 0, total: 0 };
      byDomain[q.domain].total += 1;
      if (ok) { byDomain[q.domain].correct += 1; score += 1; }
      if (e.answers[id] != null) recordAttempt(id, ok);
    });
    const p = pct(score, e.ids.length);
    const durationSec = Math.min(e.minutes * 60, (Date.now() - e.startedAt) / 1000);
    setResult({ ...e, score, total: e.ids.length, pct: p, passed: p >= PASS_PCT, byDomain, durationSec, timedOut });
    setProgress((pr) => ({ ...pr, exams: [...pr.exams, { date: new Date().toISOString(), score, total: e.ids.length, pct: p, passed: p >= PASS_PCT, byDomain, durationSec: Math.round(durationSec), minutes: e.minutes }] }));
    setExam(null);
  }, [recordAttempt, setProgress, setExam]);

  if (result) return <ExamResults result={result} onRestart={() => setResult(null)} onPractice={onPractice} onStudy={onStudy} />;
  if (exam) return <ExamRunner exam={exam} setExam={setExam} onSubmit={submit} />;
  return <ExamSetup focus={progress.focus} onStart={start} />;
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */
function ProgressView({ progress, setProgress, onPractice, onStudy }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = domainStats(progress.attempts);
  const totals = Object.values(stats).reduce((a, s) => ({ seen: a.seen + s.seen, correct: a.correct + s.correct, mastered: a.mastered + s.mastered }), { seen: 0, correct: 0, mastered: 0 });
  const exams = progress.exams;
  const passes = exams.filter((e) => e.passed).length;
  const best = exams.reduce((m, e) => Math.max(m, e.pct), 0);
  const weak = DOMAINS.map((d) => ({ d, s: stats[d.id], p: pct(stats[d.id].correct, stats[d.id].seen) }))
    .filter((x) => x.s.seen > 0)
    .sort((a, b) => a.p - b.p);
  const untouched = DOMAINS.filter((d) => stats[d.id].seen === 0);

  const tiles = [
    ["Overall accuracy", totals.seen ? `${pct(totals.correct, totals.seen)}%` : "–", `${totals.correct} of ${totals.seen} answers`],
    ["Questions mastered", `${totals.mastered}/${QUESTIONS.length}`, "Answered correctly last time"],
    ["Mock exams", String(exams.length), `${passes} passed`],
    ["Best exam score", exams.length ? `${best}%` : "–", `Passing is ${PASS_PCT}%`],
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold text-ink">Progress</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-4">
            <p className="label">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg font-bold text-ink">Weak areas</h2>
          <p className="text-sm text-muted">Domains ranked by accuracy, lowest first.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {weak.length === 0 && <li className="text-sm text-muted">Answer a few questions in Practice to see where to focus.</li>}
            {weak.map(({ d, s, p }) => (
              <li key={d.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-ink">
                    {d.name}
                    {p < PASS_PCT && <span className="rounded bg-badsoft px-1.5 py-0.5 text-xs font-semibold text-bad">Needs work</span>}
                  </span>
                  <span className="flex shrink-0 gap-3">
                    <button onClick={() => onStudy(d.id)} className="text-xs font-semibold text-accent hover:underline">Study</button>
                    <button onClick={() => onPractice(d.id)} className="text-xs font-semibold text-accent hover:underline">Practise</button>
                  </span>
                </div>
                <Bar value={p} tone={toneFor(p, 1)} />
                <span className="font-mono text-xs tabular-nums text-muted">{p}% · {s.correct}/{s.seen} correct · {s.mastered}/{s.total} mastered</span>
              </li>
            ))}
            {untouched.length > 0 && weak.length > 0 && (
              <li className="text-sm text-muted">Not started yet: {untouched.map((d) => d.short).join(", ")}</li>
            )}
          </ul>
        </Panel>

        <Panel>
          <h2 className="font-display text-lg font-bold text-ink">Exam history</h2>
          {exams.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No mock exams yet. Your scores will appear here.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left"><th className="label py-2 pr-3">Date</th><th className="label py-2 pr-3">Score</th><th className="label py-2 pr-3">Time</th><th className="label py-2">Result</th></tr>
                </thead>
                <tbody>
                  {exams.slice().reverse().slice(0, 12).map((e) => (
                    <tr key={e.date} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3 text-muted">{new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums text-ink">{e.score}/{e.total} · {e.pct}%</td>
                      <td className="py-2 pr-3 font-mono tabular-nums text-muted">{fmtTime(e.durationSec)}</td>
                      <td className="py-2"><span className={cx("rounded px-2 py-0.5 text-xs font-semibold", e.passed ? "bg-goodsoft text-good" : "bg-badsoft text-bad")}>{e.passed ? "Pass" : "Fail"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">Reset progress</p>
          <p className="text-sm text-muted">Clears your answers, exam history and studied lessons in this browser.</p>
        </div>
        {confirmReset ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setProgress((p) => ({ ...p, attempts: {}, exams: [], studied: {} })); setConfirmReset(false); }}><Trash2 size={15} />Yes, clear everything</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmReset(true)}><Trash2 size={15} />Reset</Button>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "study", label: "Study", icon: Library },
  { id: "practice", label: "Practice", icon: BookOpen },
  { id: "exam", label: "Mock exam", icon: Timer },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

export default function App() {
  const { progress, setProgress, recordAttempt } = useProgress();
  const [tab, setTab] = useState(() => {
    const h = (typeof location !== "undefined" && location.hash.slice(1)) || "";
    return TABS.some((t) => t.id === h) ? h : "dashboard";
  });
  const [practiceDomain, setPracticeDomain] = useState(null);
  const [practiceKey, setPracticeKey] = useState(0);
  const [studyDomain, setStudyDomain] = useState(null);
  const [studyKey, setStudyKey] = useState(0);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1);
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (progress.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", progress.theme);
  }, [progress.theme]);

  const go = (id) => {
    setTab(id);
    try { history.replaceState(null, "", `#${id}`); } catch (e) { /* ignore */ }
    window.scrollTo({ top: 0 });
  };
  const practiseDomain = (domainId) => { setPracticeDomain(domainId); setPracticeKey((k) => k + 1); go("practice"); };
  const studyTopic = (domainId) => { setStudyDomain(domainId); setStudyKey((k) => k + 1); go("study"); };
  const cycleTheme = () => setProgress((p) => ({ ...p, theme: { system: "light", light: "dark", dark: "system" }[p.theme] }));
  const ThemeIcon = { system: Monitor, light: Sun, dark: Moon }[progress.theme];

  return (
    <div className="min-h-full bg-bg text-ink">
      <header className="sticky z-30 border-b border-line bg-surface/95 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="gutter mx-auto flex max-w-6xl items-center justify-between gap-3 py-3">
          <button onClick={() => go("dashboard")} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-onaccent"><GraduationCap size={20} /></span>
            <span className="text-left leading-tight">
              <span className="block font-display text-base font-bold text-ink">CCAR-F Study Lab</span>
              <span className="hidden font-mono text-[11px] text-muted sm:block">Claude Certified Architect · Foundations</span>
            </span>
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined}
                className={cx("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition", tab === t.id ? "bg-accentsoft text-accent" : "text-muted hover:text-ink")}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </nav>
          <button onClick={cycleTheme} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-ink" aria-label={`Theme: ${progress.theme}. Click to change.`}>
            <ThemeIcon size={16} /><span className="capitalize">{progress.theme}</span>
          </button>
        </div>
        <nav className="gutter grid grid-cols-5 gap-1 pb-2 md:hidden" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined}
              className={cx("flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold", tab === t.id ? "bg-accentsoft text-accent" : "text-muted")}>
              <t.icon size={17} />{t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="gutter mx-auto max-w-6xl py-6 sm:py-8">
        {tab === "dashboard" && <Dashboard progress={progress} setProgress={setProgress} go={go} onStudy={studyTopic} />}
        {tab === "study" && <StudyGuide key={`s${studyKey}`} progress={progress} setProgress={setProgress} onPractice={practiseDomain} initialDomain={studyDomain} />}
        {tab === "practice" && <Practice key={practiceKey} progress={progress} recordAttempt={recordAttempt} initialDomain={practiceDomain} />}
        {tab === "exam" && <MockExam progress={progress} setProgress={setProgress} recordAttempt={recordAttempt} onPractice={practiseDomain} onStudy={studyTopic} />}
        {tab === "progress" && <ProgressView progress={progress} setProgress={setProgress} onPractice={practiseDomain} onStudy={studyTopic} />}
      </main>
    </div>
  );
}
