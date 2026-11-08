import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen, Layers, Timer, BarChart3, ChevronLeft, ChevronRight, Check, X, Flag, Lightbulb,
  Target, Network, Terminal, MessageSquareText, Wrench, ShieldCheck, RotateCcw, Trophy,
  AlertTriangle, Info, Play, Pause, Clock, CircleCheck, LayoutGrid, Sparkles, Bookmark, ScrollText, Ban,
} from "lucide-react";
import { DOMAINS, LESSONS, EXAM_FACTS, SCENARIOS } from "./lessons.js";
import { QUESTIONS } from "./questions.js";
import { CHEAT_SHEET } from "./cheatSheet.js";
import { MOCKS, MOCK_QUESTIONS } from "./mocks.js";

/* ============================ Storage ============================ */
const KEY = "ccarf-v2";
const EXAM_KEY = "ccarf-v2-exam";
const mem = {};
const store = {
  get(k, f) { try { const r = localStorage.getItem(k); if (r != null) return JSON.parse(r); } catch (e) {} return k in mem ? mem[k] : f; },
  set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} },
};
const EMPTY = { learned: {}, attempts: {}, exams: [], theme: "system" };

/* ============================ Helpers ============================ */
const ICONS = { Network, Terminal, MessageSquareText, Wrench, ShieldCheck };
const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const lessonById = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
const qById = Object.fromEntries([...QUESTIONS, ...MOCK_QUESTIONS].map((q) => [q.id, q]));
const isMulti = (q) => Array.isArray(q.answer);
const isRightOpt = (q, o) => (isMulti(q) ? q.answer.includes(o) : q.answer === o);
const isChosen = (picked, o) => (Array.isArray(picked) ? picked.includes(o) : picked === o);
const hasAnswer = (a) => (Array.isArray(a) ? a.length > 0 : a != null);
const isCorrect = (q, a) => (isMulti(q)
  ? Array.isArray(a) && a.length === q.answer.length && q.answer.every((x) => a.includes(x))
  : a === q.answer);
const PASS = 72; // mirrors 720 / 1000
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const cx = (...c) => c.filter(Boolean).join(" ");
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const orderFor = (ids) => Object.fromEntries(ids.map((id) => [id, shuffle(qById[id].options.map((_, i) => i))]));
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const lessonsIn = (d) => LESSONS.filter((l) => l.domain === d);
const questionsIn = (d) => QUESTIONS.filter((q) => q.domain === d);

function Rich({ text }) {
  return text.split("`").map((p, i) => (i % 2
    ? <code key={i} className="rounded-md bg-fill px-1.5 py-0.5 font-mono text-[0.86em]">{p}</code>
    : <React.Fragment key={i}>{p}</React.Fragment>));
}

/* ============================ iOS building blocks ============================ */
function IconTile({ color, children, size = 30 }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[8px] text-white" style={{ background: color, width: size, height: size }}>
      {children}
    </span>
  );
}

function DomainIcon({ d, size = 30 }) {
  const I = ICONS[d.icon];
  return <IconTile color={d.color} size={size}><I size={Math.round(size * 0.58)} strokeWidth={2.2} /></IconTile>;
}

function Group({ header, footer, children }) {
  return (
    <section className="flex flex-col">
      {header && <h2 className="px-4 pb-1.5 text-[13px] uppercase tracking-wide text-label2">{header}</h2>}
      <div className="overflow-hidden rounded-[12px] bg-card">{children}</div>
      {footer && <p className="px-4 pt-1.5 text-[13px] leading-snug text-label2">{footer}</p>}
    </section>
  );
}

function Row({ icon, title, subtitle, detail, onClick, chevron = true, last, danger, children }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={cx("flex w-full items-center gap-3 pl-4 text-left", onClick && "active:bg-fill transition-colors")}>
      {icon}
      <div className={cx("flex min-h-[48px] min-w-0 flex-1 items-center gap-2 py-2.5 pr-4", !last && "border-b-[0.5px] border-sep")}>
        <div className="min-w-0 flex-1">
          <div className={cx("text-[17px] leading-snug", danger ? "text-red" : "text-label")}>{title}</div>
          {subtitle && <div className="mt-0.5 text-[13px] leading-snug text-label2">{subtitle}</div>}
          {children}
        </div>
        {detail != null && <span className="shrink-0 text-[15px] tabular-nums text-label2">{detail}</span>}
        {onClick && chevron && <ChevronRight size={18} className="shrink-0 text-label3" />}
      </div>
    </Tag>
  );
}

function LargeTitle({ title, subtitle }) {
  return (
    <header className="px-1 pb-2 pt-3">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-label">{title}</h1>
      {subtitle && <p className="mt-1 text-[15px] leading-snug text-label2">{subtitle}</p>}
    </header>
  );
}

function NavBar({ back, onBack, title, right }) {
  return (
    <div className="navbar sticky z-30 -mx-4 mb-2 flex h-11 items-center justify-between gap-2 px-2">
      <button onClick={onBack} className={cx("flex min-w-0 items-center text-[17px] text-blue active:opacity-50", title && "max-w-[34%]")}>
        <ChevronLeft size={28} strokeWidth={2.2} className="-mr-0.5 shrink-0" /><span className="truncate">{back}</span>
      </button>
      {title && <span className="absolute left-1/2 max-w-[32%] -translate-x-1/2 truncate text-[17px] font-semibold text-label">{title}</span>}
      <div className="flex min-w-[60px] justify-end">{right}</div>
    </div>
  );
}

function Button({ kind = "filled", className, children, ...rest }) {
  const k = {
    filled: "bg-blue text-white active:opacity-80",
    tinted: "bg-blue/15 text-blue active:opacity-70",
    plain: "text-blue active:opacity-50",
    gray: "bg-fill text-label active:opacity-70",
    danger: "bg-red text-white active:opacity-80",
  }[kind];
  return (
    <button className={cx("inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[12px] px-5 text-[17px] font-semibold transition disabled:opacity-40", k, className)} {...rest}>
      {children}
    </button>
  );
}

function Ring({ value, size = 64, stroke = 7, color = "var(--blue)", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: "stroke-dashoffset .5s" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function ProgressBar({ value, color = "var(--blue)" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-fill">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-[9px] bg-fill p-0.5">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} aria-pressed={value === v}
          className={cx("flex-1 rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition", value === v ? "bg-card text-label shadow-sm" : "text-label2")}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ============================ Answer options ============================ */
function Options({ q, order, picked, reveal, onPick, explain }) {
  return (
    <div className="flex flex-col gap-2.5">
      {order.map((o, pos) => {
        const right = isRightOpt(q, o), chosen = isChosen(picked, o);
        let st = "idle";
        if (reveal) st = right ? "right" : chosen ? "wrong" : "dim";
        else if (chosen) st = "chosen";
        const ring = { idle: "border-transparent", chosen: "border-blue", right: "border-green", wrong: "border-red", dim: "border-transparent opacity-70" }[st];
        const badge = { idle: "bg-fill text-label2", chosen: "bg-blue text-white", right: "bg-green text-white", wrong: "bg-red text-white", dim: "bg-fill text-label2" }[st];
        return (
          <button key={o} disabled={reveal || !onPick} onClick={() => onPick && onPick(o)}
            className={cx("flex w-full gap-3 rounded-[14px] border-2 bg-card p-3.5 text-left transition active:scale-[0.99]", ring)}>
            <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-bold", badge)}>
              {reveal && right ? <Check size={16} strokeWidth={3} /> : reveal && chosen ? <X size={16} strokeWidth={3} /> : LETTERS[pos]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] leading-snug text-label">{q.options[o]}</span>
              {reveal && explain && (right || chosen || explain === "all") && (
                <span className={cx("mt-1.5 block text-[14px] leading-snug", right ? "text-green" : "text-label2")}>{q.why[o]}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================ LEARN ============================ */
function LearnHome({ p, open }) {
  const learned = Object.keys(p.learned).filter((k) => p.learned[k]).length;
  const next = LESSONS.find((l) => !p.learned[l.id]);
  const [showFacts, setShowFacts] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <LargeTitle title="Learn" subtitle="Claude Certified Architect – Foundations" />

      <div className="flex items-center gap-4 rounded-[16px] bg-card p-4">
        <Ring value={pct(learned, LESSONS.length)} size={72} stroke={8}>
          <span className="text-[15px] font-bold tabular-nums text-label">{pct(learned, LESSONS.length)}%</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">Your progress</p>
          <p className="text-[17px] font-semibold text-label">{learned} of {LESSONS.length} lessons done</p>
          {next ? (
            <button onClick={() => open({ view: "lesson", id: next.id })} className="mt-2 flex items-center gap-1 text-[15px] font-semibold text-blue active:opacity-50">
              <Play size={14} fill="currentColor" />{learned ? "Continue" : "Start"}: {next.title}
            </button>
          ) : <p className="mt-1 text-[15px] text-green">All lessons done. Try a mock exam!</p>}
        </div>
      </div>

      <Group header="Topics" footer="Percentages show how much of the real exam each topic covers.">
        {DOMAINS.map((d, i) => {
          const ls = lessonsIn(d.id), done = ls.filter((l) => p.learned[l.id]).length;
          return (
            <Row key={d.id} last={i === DOMAINS.length - 1} icon={<DomainIcon d={d} />} title={d.name}
              subtitle={`${d.weight}% of exam · ${ls.length} lessons`} detail={done === ls.length ? <CircleCheck size={20} className="text-green" /> : `${done}/${ls.length}`}
              onClick={() => open({ view: "domain", id: d.id })} />
          );
        })}
      </Group>

      <Group header="About the exam">
        <Row icon={<IconTile color="#8E8E93"><Info size={17} /></IconTile>} title="Exam at a glance" subtitle="Format, passing score and scenarios"
          onClick={() => setShowFacts((s) => !s)} chevron={false} detail={<ChevronRight size={18} className={cx("text-label3 transition", showFacts && "rotate-90")} />} last={!showFacts} />
        {showFacts && (
          <div className="px-4 pb-4">
            <dl className="divide-y-[0.5px] divide-sep">
              {EXAM_FACTS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2 text-[15px]"><dt className="text-label2">{k}</dt><dd className="text-right text-label">{v}</dd></div>
              ))}
            </dl>
            <p className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-label2">The 6 scenarios</p>
            <ul className="flex flex-col gap-2">
              {SCENARIOS.map(([t, s]) => (
                <li key={t} className="text-[15px] leading-snug"><span className="font-semibold text-label">{t}.</span> <span className="text-label2">{s}</span></li>
              ))}
            </ul>
          </div>
        )}
      </Group>

      <p className="px-4 text-[13px] leading-snug text-label2">
        Lessons follow the five domains of Anthropic's published CCAR-F exam guide. Questions are original practice items, not real exam questions.
      </p>
    </div>
  );
}

function DomainView({ p, id, open, back, practice }) {
  const d = domainById[id];
  const ls = lessonsIn(id);
  const done = ls.filter((l) => p.learned[l.id]).length;
  return (
    <div className="flex flex-col gap-5">
      <NavBar back="Learn" onBack={back} />
      <div className="flex items-start gap-3 px-1">
        <DomainIcon d={d} size={52} />
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-label">{d.name}</h1>
          <p className="text-[15px] text-label2">{d.weight}% of the exam · {done}/{ls.length} done</p>
        </div>
      </div>
      <p className="px-1 text-[17px] leading-relaxed text-label">{d.intro}</p>
      <Group header="Lessons">
        {ls.map((l, i) => (
          <Row key={l.id} last={i === ls.length - 1} title={l.title} subtitle={l.remember}
            icon={p.learned[l.id]
              ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green text-white"><Check size={16} strokeWidth={3} /></span>
              : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill text-[13px] font-bold text-label2">{i + 1}</span>}
            onClick={() => open({ view: "lesson", id: l.id })} />
        ))}
      </Group>
      <Button kind="tinted" onClick={() => practice(id)}><Layers size={18} />Practise {questionsIn(id).length} questions</Button>
    </div>
  );
}

function QuickCheck({ check }) {
  const [picked, setPicked] = useState(null);
  return (
    <div className="rounded-[16px] bg-card p-4">
      <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-blue"><Target size={14} />Quick check</p>
      <p className="mb-3 text-[17px] font-semibold leading-snug text-label">{check.q}</p>
      <div className="flex flex-col gap-2">
        {check.options.map((o, i) => {
          const reveal = picked != null, right = i === check.answer, chosen = picked === i;
          return (
            <button key={i} disabled={reveal} onClick={() => setPicked(i)}
              className={cx("flex items-center gap-2.5 rounded-[12px] px-3.5 py-3 text-left text-[16px] transition",
                !reveal && "bg-fill active:opacity-70",
                reveal && right && "bg-green/15 text-label",
                reveal && chosen && !right && "bg-red/15 text-label",
                reveal && !right && !chosen && "bg-fill opacity-60")}>
              {reveal && right ? <CircleCheck size={20} className="shrink-0 text-green" /> : reveal && chosen ? <X size={20} className="shrink-0 text-red" /> : <span className="h-5 w-5 shrink-0 rounded-full border-2 border-label3" />}
              <span className="text-label">{o}</span>
            </button>
          );
        })}
      </div>
      {picked != null && (
        <p className={cx("mt-3 text-[15px] leading-snug", picked === check.answer ? "text-green" : "text-label")}>
          <span className="font-semibold">{picked === check.answer ? "Correct! " : "Not quite. "}</span>{check.why}
        </p>
      )}
    </div>
  );
}

function LessonView({ p, setP, id, open, back }) {
  const l = lessonById[id], d = domainById[l.domain];
  const idx = LESSONS.findIndex((x) => x.id === id);
  const next = LESSONS[idx + 1];
  const isDone = !!p.learned[id];
  const finish = () => {
    setP((s) => ({ ...s, learned: { ...s.learned, [id]: true } }));
    if (next) open({ view: "lesson", id: next.id }, true); else back();
  };
  return (
    <div className="flex flex-col gap-4">
      <NavBar back={d.name} onBack={back} />
      <div className="px-1">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide" style={{ color: d.color }}>
          <DomainIcon d={d} size={18} />Lesson {l.id}
        </p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-label" style={{ textWrap: "balance" }}>{l.title}</h1>
      </div>

      <div className="rounded-[16px] bg-card p-4">
        <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-label2">In simple words</p>
        <p className="text-[18px] leading-relaxed text-label">{l.simple}</p>
      </div>

      <div className="rounded-[16px] bg-yellow/15 p-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-orange"><Lightbulb size={15} />Think of it like this</p>
        <p className="text-[17px] leading-relaxed text-label">{l.analogy}</p>
      </div>

      <div className="rounded-[16px] bg-card p-4">
        <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-label2">Key points</p>
        <ul className="flex flex-col gap-3">
          {l.points.map((pt, i) => (
            <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-label">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: d.color }}><Check size={12} strokeWidth={3.5} /></span>
              <span className="min-w-0"><Rich text={pt} /></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[16px] bg-card p-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-label2"><Sparkles size={14} />Real example</p>
        <p className="text-[16px] leading-relaxed text-label"><Rich text={l.example} /></p>
      </div>

      <div className="flex items-center gap-3 rounded-[16px] bg-blue p-4 text-white">
        <Bookmark size={22} className="shrink-0" fill="currentColor" />
        <div><p className="text-[13px] font-semibold uppercase tracking-wide opacity-80">Remember</p><p className="text-[17px] font-semibold leading-snug">{l.remember}</p></div>
      </div>

      <QuickCheck key={id} check={l.check} />

      <Button onClick={finish} className="mt-1 w-full">
        {isDone ? (next ? "Next lesson" : "Back to topic") : (next ? "Got it, next lesson" : "Got it, finish topic")}<ChevronRight size={20} />
      </Button>
      {next && <p className="text-center text-[13px] text-label2">Up next: {next.title}</p>}
    </div>
  );
}

/* ============================ PRACTICE ============================ */
function PracticeHome({ p, start }) {
  const missed = QUESTIONS.filter((q) => p.attempts[q.id] && p.attempts[q.id].last === false);
  return (
    <div className="flex flex-col gap-6">
      <LargeTitle title="Practice" subtitle="Exam-style questions with an explanation for every answer." />
      <Group>
        <Row icon={<IconTile color="#007AFF"><LayoutGrid size={17} /></IconTile>} title="All topics, mixed" subtitle={`${QUESTIONS.length} questions in random order`} onClick={() => start("all")} />
        <Row last icon={<IconTile color="#FF3B30"><RotateCcw size={17} /></IconTile>} title="Questions I got wrong" subtitle={missed.length ? `${missed.length} to retry` : "None yet"}
          onClick={missed.length ? () => start("missed") : undefined} chevron={!!missed.length} />
      </Group>
      <Group header="By topic">
        {DOMAINS.map((d, i) => {
          const qs = questionsIn(d.id);
          const a = qs.map((q) => p.attempts[q.id]).filter(Boolean);
          const right = a.filter((x) => x.last).length;
          return <Row key={d.id} last={i === DOMAINS.length - 1} icon={<DomainIcon d={d} />} title={d.name} subtitle={`${qs.length} questions`}
            detail={a.length ? `${right}/${qs.length}` : null} onClick={() => start(d.id)} />;
        })}
      </Group>
    </div>
  );
}

function PracticeRun({ set, record, back, openLesson }) {
  const deck = useMemo(() => {
    if (set.mode === "all") return shuffle(QUESTIONS);
    if (set.mode === "missed") return shuffle(QUESTIONS.filter((q) => set.missed.includes(q.id)));
    return questionsIn(set.mode);
  }, [set]);
  const orders = useMemo(() => orderFor(deck.map((q) => q.id)), [deck]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const title = set.mode === "all" ? "Mixed" : set.mode === "missed" ? "Retry" : domainById[set.mode].name;

  if (i >= deck.length) {
    const s = pct(score, deck.length);
    return (
      <div className="flex flex-col gap-5">
        <NavBar back="Practice" onBack={back} />
        <div className="flex flex-col items-center gap-3 rounded-[16px] bg-card p-6 text-center">
          <Ring value={s} size={110} stroke={10} color={s >= PASS ? "var(--green)" : "var(--orange)"}>
            <span className="text-[26px] font-bold tabular-nums text-label">{s}%</span>
          </Ring>
          <h1 className="text-[22px] font-bold text-label">{s >= PASS ? "Great work!" : "Keep practising!"}</h1>
          <p className="text-[15px] text-label2">You got {score} of {deck.length} right.</p>
        </div>
        <Button onClick={back}>Done</Button>
      </div>
    );
  }

  const q = deck[i];
  const reveal = picked != null;
  const pick = (o) => { setPicked(o); const ok = o === q.answer; if (ok) setScore((s) => s + 1); record(q.id, ok); };
  const nextQ = () => { setPicked(null); setShowAll(false); setI((x) => x + 1); };
  const lesson = lessonById[q.lesson];

  return (
    <div className="flex flex-col gap-4">
      <NavBar back="Practice" onBack={back} title={title} right={<span className="text-[15px] tabular-nums text-label2">{i + 1}/{deck.length}</span>} />
      <ProgressBar value={pct(i, deck.length)} />
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-white" style={{ background: domainById[q.domain].color }}>{domainById[q.domain].name}</span>
        <span className="text-[13px] text-label2">Scenario: {q.scenario}</span>
      </div>
      <p className="px-1 text-[19px] font-semibold leading-snug text-label">{q.q}</p>
      <Options q={q} order={orders[q.id]} picked={picked} reveal={reveal} onPick={pick} explain={showAll ? "all" : true} />
      {reveal && (
        <div className="flex flex-col gap-3">
          <div className={cx("flex items-center gap-2 rounded-[12px] p-3 text-[16px] font-semibold", picked === q.answer ? "bg-green/15 text-green" : "bg-red/15 text-red")}>
            {picked === q.answer ? <><CircleCheck size={20} />Correct!</> : <><AlertTriangle size={20} />Not quite. The right answer is in green.</>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
            {!showAll && <button onClick={() => setShowAll(true)} className="text-[15px] font-semibold text-blue active:opacity-50">Explain every option</button>}
            {lesson && <button onClick={() => openLesson(lesson.id)} className="text-[15px] font-semibold text-blue active:opacity-50">Review lesson: {lesson.title}</button>}
          </div>
          <Button onClick={nextQ}>{i === deck.length - 1 ? "See results" : "Next question"}<ChevronRight size={20} /></Button>
        </div>
      )}
    </div>
  );
}

/* ============================ EXAM ============================ */
function ExamHome({ start, history, instant, setInstant }) {
  return (
    <div className="flex flex-col gap-6">
      <LargeTitle title="Mock exam" subtitle={instant ? "Timed, with answers shown as you go." : "Timed, like the real thing. No hints until you finish."} />
      <Group footer={instant ? "Each answer is marked right or wrong, with explanations, as soon as you pick it." : "Exam style: no answers until you finish, like the real exam."}>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 text-[17px] text-label">Show answers as I go</span>
          <button role="switch" aria-checked={instant} aria-label="Show answers as I go" onClick={() => setInstant(!instant)}
            className={cx("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors", instant ? "bg-green" : "bg-fill")}>
            <span className={cx("absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all", instant ? "left-[22px]" : "left-[2px]")} />
          </button>
        </div>
      </Group>
      <Group header="Mock exams" footer="Original questions written to match the official exam guide's scenarios, domains and weightings. They are not real or leaked exam questions. Questions are grouped by scenario, like the real exam, and some ask you to pick 2 answers.">
        {MOCKS.map((m, i) => {
          const runs = history.filter((e) => e.mockId === m.id);
          const best = runs.length ? Math.max(...runs.map((e) => e.pct)) : null;
          const scen = [...new Set(m.questions.map((q) => q.scenario))];
          return (
            <Row key={m.id} last={i === MOCKS.length - 1} icon={<IconTile color={["#FF2D55", "#5856D6", "#FF9500", "#34C759"][i % 4]}><ScrollText size={17} /></IconTile>}
              title={m.title} subtitle={`${m.subtitle ? m.subtitle + " · " : ""}${m.questions.length} questions · ${m.minutes} min`}
              detail={best != null ? <span className={cx("rounded-full px-2.5 py-0.5 text-[13px] font-semibold text-white", best >= PASS ? "bg-green" : "bg-orange")}>Best {best}%</span> : null}
              onClick={() => start(m.questions.length, m.minutes, m)} />
          );
        })}
      </Group>
      <Group header="Random practice exams" footer={`Pass mark is ${PASS}%, matching the real exam's 720 out of 1,000. The real exam has 60 questions in 120 minutes, about 2 minutes each, so these use the same pace.`}>
        <Row icon={<IconTile color="#34C759"><Clock size={17} /></IconTile>} title="Quick exam" subtitle="15 questions · 30 minutes" onClick={() => start(15, 30)} />
        <Row last icon={<IconTile color="#5856D6"><Trophy size={17} /></IconTile>} title="Full practice exam" subtitle={`All ${QUESTIONS.length} questions · 60 minutes`} onClick={() => start(QUESTIONS.length, 60)} />
      </Group>
      <Group header="Tips">
        {["Read the question's last sentence first so you know what it asks.", "Look for the one detail that decides it: cost, safety, speed or a must-follow rule.", "Flag hard questions and come back to them.", "There's no penalty for guessing, so answer everything."].map((t, i, a) => (
          <Row key={t} last={i === a.length - 1} icon={<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fill text-[12px] font-bold text-label2">{i + 1}</span>} title={<span className="text-[15px]">{t}</span>} />
        ))}
      </Group>
    </div>
  );
}

function ExamRun({ exam, setExam, submit }) {
  const [now, setNow] = useState(Date.now());
  const [sheet, setSheet] = useState(null); // "map" | "submit"
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const paused = !!exam.pausedAt;
  const left = (exam.endsAt - (paused ? exam.pausedAt : now)) / 1000;
  const fired = useRef(false);
  useEffect(() => { if (!paused && left <= 0 && !fired.current) { fired.current = true; submit(true); } }, [left, paused, submit]);
  const pause = useCallback(() => setExam((e) => (e && !e.pausedAt ? { ...e, pausedAt: Date.now() } : e)), [setExam]);
  const resume = () => setExam((e) => {
    if (!e || !e.pausedAt) return e;
    const d = Date.now() - e.pausedAt;
    return { ...e, endsAt: e.endsAt + d, at: e.at + d, pausedAt: null };
  });
  // Pause automatically when the app goes to the background or is closed, so time isn't lost.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") pause(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", pause);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", pause); };
  }, [pause]);
  // Leaving the Exam tab also pauses it.
  useEffect(() => () => pause(), [pause]);
  const id = exam.ids[exam.cur], q = qById[id];
  const answered = exam.ids.filter((x) => hasAnswer(exam.answers[x])).length;
  const set = (patch) => setExam((e) => ({ ...e, ...patch }));
  const flagged = !!exam.flags[id];
  const a = exam.answers[id];
  const revealed = exam.instant !== false && (isMulti(q) ? Array.isArray(a) && a.length === q.answer.length : a != null);

  return (
    <div className="flex flex-col gap-4">
      <div className="navbar sticky z-30 -mx-4 mb-1 flex h-11 items-center justify-between px-4">
        <button onClick={() => setSheet("map")} className="flex items-center gap-1.5 text-[17px] text-blue active:opacity-50"><LayoutGrid size={18} />{exam.cur + 1}/{exam.ids.length}</button>
        <button onClick={pause} aria-label="Pause exam" className={cx("flex items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-[17px] font-semibold tabular-nums active:opacity-50", left < 300 ? "text-red" : "text-label")}>
          <Pause size={15} fill="currentColor" />{fmt(left)}
        </button>
        <button onClick={() => setSheet("submit")} className="text-[17px] font-semibold text-blue active:opacity-50">Finish</button>
      </div>
      <ProgressBar value={pct(answered, exam.ids.length)} />
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[13px] text-label2">Scenario: {q.scenario}</span>
        <button onClick={() => set({ flags: { ...exam.flags, [id]: !flagged } })} aria-pressed={flagged}
          className={cx("flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold", flagged ? "bg-orange text-white" : "bg-fill text-label2")}>
          <Flag size={13} fill={flagged ? "currentColor" : "none"} />{flagged ? "Flagged" : "Flag"}
        </button>
      </div>
      {exam.mockId && (exam.cur === 0 || qById[exam.ids[exam.cur - 1]].scenario !== q.scenario) && (
        <div className="rounded-[14px] bg-blue/10 p-3.5">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-blue">New scenario</p>
          <p className="mt-0.5 text-[17px] font-semibold text-label">{q.scenario}</p>
          <p className="mt-1 text-[14px] leading-snug text-label2">{(SCENARIOS.find(([t]) => t === q.scenario) || [])[1]}</p>
        </div>
      )}
      <p className="px-1 text-[19px] font-semibold leading-snug text-label">{q.q}</p>
      {isMulti(q) && <p className="-mt-1 px-1 text-[14px] font-semibold text-blue">Select {q.answer.length} answers</p>}
      {revealed && (
        <div className={cx("flex items-center gap-2 rounded-[12px] p-3 text-[16px] font-semibold", isCorrect(q, exam.answers[id]) ? "bg-green/15 text-green" : "bg-red/15 text-red")}>
          {isCorrect(q, exam.answers[id]) ? <><CircleCheck size={20} />Correct!</> : <><AlertTriangle size={20} />Not quite. The right answer{isMulti(q) ? "s are" : " is"} in green.</>}
        </div>
      )}
      <Options q={q} order={exam.orders[id]} picked={exam.answers[id]} reveal={revealed} explain="all" onPick={(o) => {
        let v = o;
        if (isMulti(q)) {
          const cur = Array.isArray(exam.answers[id]) ? exam.answers[id] : [];
          v = cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o].slice(-q.answer.length);
        }
        set({ answers: { ...exam.answers, [id]: v } });
      }} />
      <div className="mt-1 grid grid-cols-2 gap-3">
        <Button kind="gray" disabled={exam.cur === 0} onClick={() => set({ cur: exam.cur - 1 })}><ChevronLeft size={20} />Back</Button>
        {exam.cur < exam.ids.length - 1
          ? <Button onClick={() => set({ cur: exam.cur + 1 })}>Next<ChevronRight size={20} /></Button>
          : <Button onClick={() => setSheet("submit")}>Finish</Button>}
      </div>

      {paused && (
        <div className="fixed inset-0 z-[35] flex flex-col items-center justify-center gap-5 bg-bg px-8 pb-24 text-center" role="dialog" aria-modal="true" aria-label="Exam paused">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue/15 text-blue"><Pause size={30} fill="currentColor" /></span>
          <div>
            <h2 className="text-[28px] font-bold text-label">Paused</h2>
            <p className="mt-1 text-[17px] text-label2">{exam.title || "Exam"} · {fmt(left)} left · {answered}/{exam.ids.length} answered</p>
            <p className="mt-2 text-[15px] text-label2">The timer is stopped. Questions are hidden until you resume.</p>
          </div>
          <div className="w-full max-w-[320px]"><Button onClick={resume}><Play size={18} fill="currentColor" />Resume</Button></div>
        </div>
      )}
      {sheet && !paused && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSheet(null)}>
          <div className="sheet w-full max-w-[520px] rounded-t-[20px] bg-bg p-4 sm:rounded-[20px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-label3 sm:hidden" />
            {sheet === "map" ? (
              <>
                <h2 className="mb-3 text-[20px] font-bold text-label">Questions</h2>
                <div className="grid grid-cols-6 gap-2">
                  {exam.ids.map((x, i) => (
                    <button key={x} onClick={() => { set({ cur: i }); setSheet(null); }}
                      className={cx("relative flex h-11 items-center justify-center rounded-[10px] text-[15px] font-semibold tabular-nums",
                        hasAnswer(exam.answers[x]) ? "bg-blue text-white" : "bg-card text-label", i === exam.cur && "ring-2 ring-blue ring-offset-2 ring-offset-[var(--bg)]")}>
                      {i + 1}{exam.flags[x] && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--bg)] bg-orange" />}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13px] text-label2">Blue = answered. Orange dot = flagged.</p>
              </>
            ) : (
              <>
                <h2 className="text-[20px] font-bold text-label">Finish the exam?</h2>
                <p className="mt-1 text-[15px] leading-snug text-label2">
                  You answered {answered} of {exam.ids.length}.
                  {answered < exam.ids.length && ` ${exam.ids.length - answered} unanswered will count as wrong.`}
                  {Object.values(exam.flags).filter(Boolean).length > 0 && ` ${Object.values(exam.flags).filter(Boolean).length} still flagged.`}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button onClick={() => { fired.current = true; submit(false); }}>Finish and see score</Button>
                  <Button kind="gray" onClick={() => setSheet(null)}>Keep going</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExamResult({ r, done, openLesson }) {
  const [filter, setFilter] = useState("wrong");
  const [open, setOpen] = useState(null);
  const items = r.ids.map((id, i) => ({ id, i, q: qById[id], a: r.answers[id] }));
  const shown = items.filter((x) => filter === "all" || !isCorrect(x.q, x.a));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 rounded-[16px] bg-card p-6 text-center">
        <Ring value={r.pct} size={120} stroke={11} color={r.passed ? "var(--green)" : "var(--red)"}>
          <span className="text-[28px] font-bold tabular-nums text-label">{r.pct}%</span>
        </Ring>
        <h1 className="mt-1 text-[24px] font-bold text-label">{r.passed ? "You passed!" : "Not yet. Keep going!"}</h1>
        <p className="text-[15px] text-label2">{r.title ? `${r.title} · ` : ""}{r.score} of {r.total} correct · pass mark {PASS}%{r.timedOut ? " · time ran out" : ""} · {fmt(r.secs)} used</p>
      </div>

      <Group header="Score by topic">
        {DOMAINS.filter((d) => r.byDomain[d.id]).map((d, i, a) => {
          const s = r.byDomain[d.id], v = pct(s.c, s.t);
          return (
            <Row key={d.id} last={i === a.length - 1} icon={<DomainIcon d={d} />} title={d.name} detail={`${s.c}/${s.t}`}>
              <div className="mt-1.5"><ProgressBar value={v} color={v >= PASS ? "var(--green)" : v >= 50 ? "var(--orange)" : "var(--red)"} /></div>
            </Row>
          );
        })}
      </Group>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-[20px] font-bold text-label">Review</h2>
          <div className="w-48"><Segmented value={filter} onChange={setFilter} options={[["wrong", "Wrong"], ["all", "All"]]} /></div>
        </div>
        {shown.length === 0 && <p className="px-1 text-[15px] text-label2">Nothing wrong. Perfect score!</p>}
        {shown.map(({ id, i, q, a }) => {
          const ok = isCorrect(q, a);
          return (
            <div key={id} className="rounded-[14px] bg-card">
              <button onClick={() => setOpen(open === id ? null : id)} className="flex w-full items-start gap-3 p-3.5 text-left" aria-expanded={open === id}>
                <span className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white", ok ? "bg-green" : "bg-red")}>{ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-label2">Question {i + 1}{!hasAnswer(a) ? " · not answered" : ""}{isMulti(q) ? ` · select ${q.answer.length}` : ""}</span>
                  <span className={cx("block text-[15px] leading-snug text-label", open !== id && "line-clamp-2")}>{q.q}</span>
                </span>
                <ChevronRight size={18} className={cx("mt-1 shrink-0 text-label3 transition", open === id && "rotate-90")} />
              </button>
              {open === id && (
                <div className="flex flex-col gap-3 px-3.5 pb-3.5">
                  <Options q={q} order={r.orders[id]} picked={a} reveal explain="all" />
                  <button onClick={() => openLesson(q.lesson)} className="self-start text-[15px] font-semibold text-blue active:opacity-50">Review lesson: {lessonById[q.lesson].title}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button onClick={done}>Done</Button>
    </div>
  );
}

function ExamTab({ p, setP, record, openLesson }) {
  const [exam, setExamS] = useState(() => store.get(EXAM_KEY, null));
  const [result, setResult] = useState(null);
  const ref = useRef(exam); ref.current = exam;
  const setExam = useCallback((fn) => setExamS((e) => { const n = typeof fn === "function" ? fn(e) : fn; if (n) store.set(EXAM_KEY, n); else store.del(EXAM_KEY); return n; }), []);
  const start = (n, mins, mock) => {
    const ids = mock ? mock.questions.map((q) => q.id) : shuffle(QUESTIONS).slice(0, n).map((q) => q.id);
    setResult(null);
    setExam({ ids, orders: orderFor(ids), answers: {}, flags: {}, cur: 0, at: Date.now(), endsAt: Date.now() + mins * 60000, mins, mockId: mock ? mock.id : null, title: mock ? mock.title : null, instant: p.instant !== false });
    window.scrollTo({ top: 0 });
  };
  const submit = useCallback((timedOut) => {
    const e = ref.current; if (!e) return; ref.current = null;
    const byDomain = {}; let score = 0;
    e.ids.forEach((id) => {
      const q = qById[id], ok = isCorrect(q, e.answers[id]);
      byDomain[q.domain] = byDomain[q.domain] || { c: 0, t: 0 };
      byDomain[q.domain].t++; if (ok) { byDomain[q.domain].c++; score++; }
      if (hasAnswer(e.answers[id])) record(id, ok);
    });
    const p = pct(score, e.ids.length), secs = Math.min(e.mins * 60, (Date.now() - e.at) / 1000);
    setResult({ ...e, score, total: e.ids.length, pct: p, passed: p >= PASS, byDomain, secs, timedOut });
    setP((s) => ({ ...s, exams: [...s.exams, { date: new Date().toISOString(), score, total: e.ids.length, pct: p, passed: p >= PASS, mockId: e.mockId || null, title: e.title || null }] }));
    setExam(null);
    window.scrollTo({ top: 0 });
  }, [record, setP, setExam]);

  if (result) return <ExamResult r={result} done={() => setResult(null)} openLesson={openLesson} />;
  if (exam) return <ExamRun exam={exam} setExam={setExam} submit={submit} />;
  return <ExamHome start={start} history={p.exams} instant={p.instant !== false} setInstant={(v) => setP((s) => ({ ...s, instant: v }))} />;
}

/* ============================ PROGRESS ============================ */
function ProgressTab({ p, setP, openDomain, practise }) {
  const [confirm, setConfirm] = useState(false);
  const learned = LESSONS.filter((l) => p.learned[l.id]).length;
  const tried = QUESTIONS.filter((q) => p.attempts[q.id]);
  const right = tried.filter((q) => p.attempts[q.id].last).length;
  const passed = p.exams.filter((e) => e.passed).length;
  const stats = DOMAINS.map((d) => {
    const qs = questionsIn(d.id).filter((q) => p.attempts[q.id]);
    const r = qs.filter((q) => p.attempts[q.id].last).length;
    const ls = lessonsIn(d.id);
    return { d, tried: qs.length, acc: pct(r, qs.length), learned: ls.filter((l) => p.learned[l.id]).length, lessons: ls.length };
  });
  const weak = stats.filter((s) => s.tried && s.acc < PASS).sort((a, b) => a.acc - b.acc);

  return (
    <div className="flex flex-col gap-6">
      <LargeTitle title="Progress" />
      <div className="grid grid-cols-3 gap-3">
        {[["Lessons", pct(learned, LESSONS.length), `${learned}/${LESSONS.length}`, "var(--blue)"],
          ["Accuracy", pct(right, tried.length), tried.length ? `${pct(right, tried.length)}%` : "–", "var(--green)"],
          ["Exams passed", p.exams.length ? pct(passed, p.exams.length) : 0, `${passed}/${p.exams.length}`, "var(--orange)"]].map(([label, v, txt, c]) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-[16px] bg-card p-3 text-center">
            <Ring value={v} size={64} stroke={7} color={c}><span className="text-[13px] font-bold tabular-nums text-label">{txt}</span></Ring>
            <span className="text-[13px] font-medium text-label2">{label}</span>
          </div>
        ))}
      </div>

      {weak.length > 0 && (
        <Group header="Focus on these" footer="Topics where your practice score is below the pass mark.">
          {weak.map((s, i) => (
            <Row key={s.d.id} last={i === weak.length - 1} icon={<DomainIcon d={s.d} />} title={s.d.name} subtitle={`${s.acc}% correct`} onClick={() => practise(s.d.id)} />
          ))}
        </Group>
      )}

      <Group header="By topic">
        {stats.map((s, i) => (
          <Row key={s.d.id} last={i === stats.length - 1} icon={<DomainIcon d={s.d} />} title={s.d.name}
            subtitle={`${s.learned}/${s.lessons} lessons · ${s.tried ? `${s.acc}% correct` : "no practice yet"}`} onClick={() => openDomain(s.d.id)} />
        ))}
      </Group>

      {p.exams.length > 0 && (
        <Group header="Exam history">
          {p.exams.slice().reverse().slice(0, 8).map((e, i, a) => (
            <Row key={e.date} last={i === a.length - 1} title={`${e.title ? e.title + " · " : ""}${e.pct}% · ${e.score}/${e.total}`}
              subtitle={new Date(e.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              detail={<span className={cx("rounded-full px-2.5 py-0.5 text-[13px] font-semibold text-white", e.passed ? "bg-green" : "bg-red")}>{e.passed ? "Pass" : "Fail"}</span>} />
          ))}
        </Group>
      )}

      <Group header="Appearance">
        <div className="p-3"><Segmented value={p.theme} onChange={(t) => setP((s) => ({ ...s, theme: t }))} options={[["system", "Automatic"], ["light", "Light"], ["dark", "Dark"]]} /></div>
      </Group>

      <Group footer="Progress is saved in this browser only.">
        {confirm ? (
          <div className="flex flex-col gap-2 p-3">
            <p className="text-center text-[15px] text-label2">Erase all lessons, answers and exams?</p>
            <Button kind="danger" onClick={() => { setP((s) => ({ ...s, learned: {}, attempts: {}, exams: [] })); setConfirm(false); }}>Erase progress</Button>
            <Button kind="gray" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        ) : (
          <Row last danger title="Reset progress" onClick={() => setConfirm(true)} chevron={false} />
        )}
      </Group>
    </div>
  );
}

/* ============================ CHEAT SHEET ============================ */
function CheatSheetTab({ openLesson }) {
  const [showMeaning, setShowMeaning] = useState(true);
  return (
    <div className="flex flex-col gap-6">
      <LargeTitle title="Cheat Sheet" subtitle="The key rules to memorise before the exam." />
      <div className="flex items-center justify-between gap-3 rounded-[12px] bg-card px-4 py-3">
        <span className="text-[17px] text-label">Show explanations</span>
        <button role="switch" aria-checked={showMeaning} onClick={() => setShowMeaning((v) => !v)}
          className={cx("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors", showMeaning ? "bg-green" : "bg-fill")}>
          <span className={cx("absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all", showMeaning ? "left-[22px]" : "left-[2px]")} />
        </button>
      </div>
      {CHEAT_SHEET.map((sec, si) => (
        <section key={sec.id} className="flex flex-col">
          <div className="px-4 pb-2">
            <h2 className={cx("text-[20px] font-bold leading-tight", sec.style === "warnings" ? "text-red" : "text-label")}>{sec.title}</h2>
            {sec.subtitle && <p className="mt-0.5 text-[13px] text-label2">{sec.subtitle}</p>}
          </div>
          {sec.style === "table" ? (
            <div className="overflow-hidden rounded-[12px] bg-card">
              {sec.items.map((it, i) => (
                <div key={i} className={cx("flex flex-col gap-1.5 px-4 py-3.5", i < sec.items.length - 1 && "border-b-[0.5px] border-sep")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold text-blue">{it.concept}</span>
                    {it.task && (
                      <button onClick={() => lessonById[it.task] && openLesson(it.task)}
                        className="shrink-0 rounded-full bg-fill px-2.5 py-0.5 text-[13px] font-semibold text-label2 active:opacity-50">Task {it.task}</button>
                    )}
                  </div>
                  <p className="text-[17px] font-semibold leading-snug text-label"><Rich text={it.rule} /></p>
                  {showMeaning && it.diagnostic && (
                    <p className="flex gap-2 rounded-[10px] bg-orange/10 px-3 py-2 text-[14px] leading-snug text-label">
                      <Target size={16} className="mt-0.5 shrink-0 text-orange" />
                      <span><span className="font-semibold text-orange">Exam diagnostic: </span><Rich text={it.diagnostic} /></span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : sec.style === "warnings" ? (
            <div className="grid gap-2.5 sm:grid-cols-3">
              {sec.items.map((it, i) => {
                const [cause, effect] = it.text.split("→").map((x) => x.trim());
                return (
                  <div key={i} className="flex flex-col gap-1.5 rounded-[14px] border-[1.5px] border-red/40 bg-red/10 p-3.5">
                    <span className="flex items-center gap-1.5 text-[17px] font-semibold text-label"><Ban size={17} className="shrink-0 text-red" /><Rich text={cause} /></span>
                    {effect && <span className="text-[15px] font-semibold text-red">→ {effect}</span>}
                    {showMeaning && it.means && <span className="text-[14px] leading-snug text-label2"><Rich text={it.means} /></span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[12px] bg-card">
              {sec.items.map((it, i) => (
                <div key={i} className="flex gap-3 pl-4">
                  {sec.style === "rules"
                    ? <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue text-[14px] font-bold text-white">{i + 1}</span>
                    : <span className="mt-[22px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />}
                  <div className={cx("min-w-0 flex-1 py-3 pr-4", i < sec.items.length - 1 && "border-b-[0.5px] border-sep")}>
                    <p className="text-[17px] font-semibold leading-snug text-label"><Rich text={it.text} /></p>
                    {showMeaning && it.means && <p className="mt-1 text-[14px] leading-snug text-label2"><Rich text={it.means} /></p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {sec.lesson && lessonById[sec.lesson] && (CHEAT_SHEET[si + 1] || {}).lesson !== sec.lesson && (
            <button onClick={() => openLesson(sec.lesson)} className="self-start px-4 pt-2 text-[15px] font-semibold text-blue active:opacity-50">
              Review lesson {sec.lesson}: {lessonById[sec.lesson].title}
            </button>
          )}
        </section>
      ))}
    </div>
  );
}

/* ============================ App shell ============================ */
const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "cheatsheet", label: "Cheat Sheet", icon: ScrollText },
  { id: "practice", label: "Practice", icon: Layers },
  { id: "exam", label: "Exam", icon: Timer },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

export default function App() {
  const [p, setP] = useState(() => ({ ...EMPTY, ...store.get(KEY, {}) }));
  useEffect(() => { store.set(KEY, p); }, [p]);
  useEffect(() => {
    const r = document.documentElement;
    if (p.theme === "system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", p.theme);
  }, [p.theme]);

  const record = useCallback((id, ok) => setP((s) => {
    const a = s.attempts[id] || { n: 0, c: 0 };
    return { ...s, attempts: { ...s.attempts, [id]: { n: a.n + 1, c: a.c + (ok ? 1 : 0), last: ok } } };
  }), []);

  const initialTab = () => { const h = location.hash.slice(1); return TABS.some((t) => t.id === h) ? h : "learn"; };
  const [tab, setTab] = useState(initialTab);
  const [learnStack, setLearnStack] = useState([]);
  const [practice, setPractice] = useState(null);
  const [practiceKey, setPracticeKey] = useState(0);

  useEffect(() => {
    const on = () => { const h = location.hash.slice(1); if (TABS.some((t) => t.id === h)) setTab(h); };
    window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on);
  }, []);

  const tapTab = (t) => {
    if (t === tab) { if (t === "learn") setLearnStack([]); if (t === "practice") setPractice(null); }
    go(t);
  };
  const go = (t) => {
    setTab(t);
    try { history.replaceState(null, "", `#${t}`); } catch (e) {}
    window.scrollTo({ top: 0 });
  };
  const pushLearn = (v, replace) => { setLearnStack((s) => (replace ? [...s.slice(0, -1), v] : [...s, v])); window.scrollTo({ top: 0 }); };
  const popLearn = () => { setLearnStack((s) => s.slice(0, -1)); window.scrollTo({ top: 0 }); };
  const openLesson = (id) => { const l = lessonById[id]; setLearnStack([{ view: "domain", id: l.domain }, { view: "lesson", id }]); go("learn"); };
  const openDomain = (id) => { setLearnStack([{ view: "domain", id }]); go("learn"); };
  const startPractice = (mode) => {
    const missed = QUESTIONS.filter((q) => p.attempts[q.id] && p.attempts[q.id].last === false).map((q) => q.id);
    setPractice({ mode, missed }); setPracticeKey((k) => k + 1); go("practice");
  };

  const top = learnStack[learnStack.length - 1];
  let screen;
  if (tab === "learn") {
    if (!top) screen = <LearnHome p={p} open={pushLearn} />;
    else if (top.view === "domain") screen = <DomainView p={p} id={top.id} open={pushLearn} back={popLearn} practice={startPractice} />;
    else screen = <LessonView key={top.id} p={p} setP={setP} id={top.id} open={pushLearn} back={popLearn} />;
  } else if (tab === "practice") {
    screen = practice ? <PracticeRun key={practiceKey} set={practice} record={record} back={() => { setPractice(null); window.scrollTo({ top: 0 }); }} openLesson={openLesson} /> : <PracticeHome p={p} start={startPractice} />;
  } else if (tab === "cheatsheet") {
    screen = <CheatSheetTab openLesson={openLesson} />;
  } else if (tab === "exam") {
    screen = <ExamTab p={p} setP={setP} record={record} openLesson={openLesson} />;
  } else {
    screen = <ProgressTab p={p} setP={setP} openDomain={openDomain} practise={startPractice} />;
  }

  return (
    <div className="min-h-full bg-bg text-label">
      <main className="gutter mx-auto max-w-[640px] pb-[calc(96px+env(safe-area-inset-bottom,0px))] pt-2">{screen}</main>
      <nav className="tabbar fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-sep" aria-label="Sections">
        <div className="gutter mx-auto grid max-w-[640px] grid-cols-5 pb-[env(safe-area-inset-bottom,0px)]">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => tapTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
              className={cx("flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium", tab === t.id ? "text-blue" : "text-label3")}>
              <t.icon size={25} strokeWidth={tab === t.id ? 2.3 : 1.8} /><span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
