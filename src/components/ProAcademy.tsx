import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { academyUnits, compactPlanDays, unitByDay, type DailyUnit, type Visual } from '../data/academy';
import { academyDepth, type DeepDay } from '../data/academy-depth';
import { assessmentStages, evidence } from '../data/evidence';
import { db, preference, type DailyProgress, type StudyBlockProgress } from '../lib/db';
import { accuracy } from '../lib/engine';
import { questions } from '../data/questions';
import type { Attempt, ModuleId, Question } from '../types';
import './pro-academy.css';

const moduleName: Record<ModuleId, string> = { ai: 'AI / GenAI', technical: 'Technical systems', communication: 'Communication', reasoning: 'Reasoning' };
const proRoutes = [
  { to: '/pro', label: 'Command' }, { to: '/curriculum', label: 'Roadmap' }, { to: '/practice/scenarios', label: 'Scenario lab' },
  { to: '/mock-test', label: 'Mock room' }, { to: '/analytics', label: 'Signals' }, { to: '/mistakes', label: 'Revision' },
  { to: '/interview', label: 'Interview' }, { to: '/assessment-pattern', label: 'Intel' }
];

type AcademyState = { attempts: Attempt[]; blocks: StudyBlockProgress[]; daily: DailyProgress[]; plan: number; activeDay: number; refresh: () => void };

function useAcademyState(): AcademyState {
  const [attempts, setAttempts] = useState<Attempt[]>([]); const [blocks, setBlocks] = useState<StudyBlockProgress[]>([]);
  const [daily, setDaily] = useState<DailyProgress[]>([]); const [plan, setPlan] = useState(30); const [activeDay, setActiveDay] = useState(1);
  const refresh = () => { void Promise.all([db.attempts.toArray(), db.studyBlocks.toArray(), db.dailyProgress.toArray(), preference('pro-plan-days', 30), preference('pro-current-day', 1)]).then(([a, b, d, p, day]) => { setAttempts(a); setBlocks(b); setDaily(d); setPlan(p); setActiveDay(day); }); };
  useEffect(refresh, []); return { attempts, blocks, daily, plan, activeDay, refresh };
}

export function ProShell({ children }: { children: React.ReactNode }) {
  const location = useLocation(); const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dataset.theme === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'light';
    preference('theme', saved).then((theme) => {
      const isDark = theme === 'dark';
      setDark(isDark);
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('theme', theme); } catch (e) {}
    });
  }, []);

  const toggle = async () => {
    const nextTheme = dark ? 'light' : 'dark';
    setDark(!dark);
    document.documentElement.dataset.theme = nextTheme;
    try { localStorage.setItem('theme', nextTheme); } catch (e) {}
    await db.preferences.put({ key: 'theme', value: nextTheme });
  };

  return <div className="pro-v2"><aside className={`pro-sidebar ${open ? 'is-open' : ''}`}>
    <Link className="pro-brand" to="/pro"><span>EX</span><b>Exceller <em>PRO</em></b></Link>
    <p className="pro-kicker">PREPARATION STUDIO</p>
    <nav aria-label="Pro Mode navigation">{proRoutes.map((item) => <Link key={item.to} className={location.pathname === item.to || (item.to === '/curriculum' && location.pathname.startsWith('/learn')) ? 'active' : ''} to={item.to} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav>
    <div className="pro-sidebar-foot">
      <Link to="/">Open Lab</Link>
      <button type="button" className="pro-theme-button" onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
        {dark ? '☀️ Light' : '🌙 Dark'}
      </button>
      <Link to="/settings">Settings</Link>
    </div>
  </aside><div className="pro-stage"><header className="pro-topbar">
    <button aria-label="Open Pro navigation" className="pro-menu" onClick={() => setOpen((value) => !value)}>Menu</button>
    <div><span>EXCELLER / ACADEMY</span><b>Evidence-first technical preparation</b></div>
    <div className="pro-topbar-actions">
      <button type="button" className="pro-theme-toggle" onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
        <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
        <span>{dark ? 'Light mode' : 'Dark mode'}</span>
      </button>
      <Link to="/learn/1">Resume your day <span aria-hidden>→</span></Link>
    </div>
  </header>{children}</div></div>;
}

function readiness(attempts: Attempt[], module: ModuleId) { return accuracy(attempts.filter((item) => questions.find((question) => question.id === item.questionId)?.module === module)); }
function scoreLabel(value: number) { return value >= 90 ? 'Excellent' : value >= 80 ? 'Strong' : value >= 60 ? 'Developing' : 'Needs review'; }
function lessonScenario(unit: DailyUnit): Question {
  const tagged = questions.filter((question) => question.module === unit.practice.module && question.kind === 'scenario' && question.tags.some((tag) => unit.topics.some((topic) => topic.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(topic.toLowerCase()))));
  return tagged[0] ?? questions.find((item) => item.module === unit.practice.module && item.kind === 'scenario') ?? questions[0];
}
function UnitStatus({ unit, blocks, daily }: { unit: DailyUnit; blocks: StudyBlockProgress[]; daily: DailyProgress[] }) {
  const count = blocks.filter((item) => item.unitId === unit.id).length; const done = daily.some((item) => item.unitId === unit.id); const percent = done ? 100 : Math.round(count / unit.blocks.length * 100);
  return <div className="unit-status"><span>{done ? 'Complete' : `${count}/${unit.blocks.length} teaching blocks`}</span><i><em style={{ width: `${percent}%` }} /></i></div>;
}

export function AcademyDashboard() {
  const state = useAcademyState(); const navigate = useNavigate(); const days = compactPlanDays(state.plan); const completed = new Set(state.daily.map((item) => item.unitId));
  const currentDay = days.includes(state.activeDay) ? state.activeDay : days.find((day) => !completed.has(unitByDay(day).id)) ?? days.at(-1) ?? 1; const current = unitByDay(currentDay);
  const scenarioAttempts = state.attempts.filter((item) => questions.find((q) => q.id === item.questionId)?.kind === 'scenario');
  const weak = Object.entries(state.attempts.reduce<Record<string, { correct: number; total: number }>>((all, item) => { const q = questions.find((question) => question.id === item.questionId); if (!q) return all; const row = all[q.subtopic] ?? { correct: 0, total: 0 }; row.total++; if (item.correct) row.correct++; all[q.subtopic] = row; return all; }, {})).filter(([, value]) => value.total >= 2 && value.correct / value.total < .7).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 3);
  const changePlan = async (plan: number) => { await db.preferences.put({ key: 'pro-plan-days', value: plan }); state.refresh(); };
  return <main className="pro-page command-page"><section className="command-hero"><div><p className="eyebrow">DAY {String(current.day).padStart(2, '0')} · {current.priority}</p><h1>{current.title}</h1><p className="hero-deck">{current.subtitle}</p><div className="hero-actions"><button onClick={() => navigate(`/learn/${current.day}`)}>Begin studio <span>→</span></button><Link to="/curriculum">View full roadmap</Link></div></div><aside><p>YOUR NEXT SESSION</p><strong>{current.minutes} min</strong><span>Learn → decide → retrieve → apply</span><UnitStatus unit={current} blocks={state.blocks} daily={state.daily} /><label>Academy path<select value={state.plan} onChange={(event) => void changePlan(Number(event.target.value))}><option value={7}>7-day sprint</option><option value={14}>14-day intensive</option><option value={30}>30-day comprehensive</option></select></label></aside></section>
    <section className="signal-strip"><article><span>Academy progress</span><b>{state.daily.length}<small> / {days.length} days</small></b><i><em style={{ width: `${Math.round(state.daily.length / days.length * 100)}%` }} /></i></article><article><span>Scenario transfer</span><b>{accuracy(scenarioAttempts)}%</b><small>{scenarioAttempts.length} saved responses</small></article><article><span>AI readiness</span><b>{readiness(state.attempts, 'ai')}%</b><small>Practice evidence only</small></article><article><span>Technical readiness</span><b>{readiness(state.attempts, 'technical')}%</b><small>Practice evidence only</small></article></section>
    <section className="command-grid"><article className="today-card"><header><div><p className="eyebrow">TODAY'S FLOW</p><h2>One complete study run.</h2></div><Link to={`/learn/${current.day}`}>Open studio</Link></header><ol>{['Orient', 'Learn', 'Decide', 'Retrieve', 'Apply', 'Reflect'].map((label, index) => <li key={label}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{label}</b><p>{index < 3 ? current.blocks[index]?.title ?? current.assignment : index === 3 ? 'Active recall with immediate feedback.' : index === 4 ? 'Answer a graded original scenario.' : 'Record the rule you will keep.'}</p></div></li>)}</ol></article>
      <article className="repair-card"><p className="eyebrow">REVISION QUEUE</p><h2>Repair the actual gap.</h2>{weak.length ? <ul>{weak.map(([topic, row]) => <li key={topic}><div><b>{topic}</b><span>{Math.round(row.correct / row.total * 100)}% · {row.total} attempts</span></div><Link to="/mistakes">Review</Link></li>)}</ul> : <p>Complete focused practice first. The academy only recommends from real saved responses—not invented weakness scores.</p>}<Link className="text-link" to="/analytics">Open performance signals →</Link></article></section>
    <section className="sequence-card"><header><div><p className="eyebrow">LOOK AHEAD</p><h2>The next three decisions you will practise.</h2></div><Link to="/curriculum">All 30 days</Link></header><div>{days.slice(days.indexOf(currentDay), days.indexOf(currentDay) + 3).map((day) => { const item = unitByDay(day); return <Link key={item.id} to={`/learn/${day}`}><span>DAY {String(day).padStart(2, '0')}</span><b>{item.title}</b><p>{academyDepth[day].mission}</p></Link>; })}</div></section></main>;
}

export function AcademyRoadmap() {
  const state = useAcademyState(); const [filter, setFilter] = useState<'all' | ModuleId>('all'); const days = compactPlanDays(state.plan); const done = new Set(state.daily.map((item) => item.unitId));
  const visible = academyUnits.filter((item) => filter === 'all' || item.module === filter);
  return <main className="pro-page roadmap-page"><section className="page-intro"><p className="eyebrow">LEARNING HUB</p><h1>A full academy, not thirty links.</h1><p>Every day now includes guided instruction, an applied case, a decision checkpoint, active recall, a graded scenario, a practical task, and a reflection.</p></section><section className="roadmap-tools"><div><b>Explore by discipline</b>{(['all', 'ai', 'technical', 'communication', 'reasoning'] as const).map((module) => <button key={module} className={filter === module ? 'selected' : ''} onClick={() => setFilter(module)}>{module === 'all' ? 'All days' : moduleName[module]}</button>)}</div><p>{state.plan}-day path · {days.length} selected sessions</p></section><section className="roadmap-grid">{visible.map((item) => <Link key={item.id} className={`${done.has(item.id) ? 'done' : ''} ${days.includes(item.day) ? '' : 'deferred'}`} to={`/learn/${item.day}`}><header><span>DAY {String(item.day).padStart(2, '0')}</span><em>{item.priority}</em></header><h2>{item.title}</h2><p>{item.subtitle}</p><div className="roadmap-meta"><span>{item.minutes} min</span><span>{item.blocks.length} guided blocks</span></div><UnitStatus unit={item} blocks={state.blocks} daily={state.daily} /></Link>)}</section></main>;
}

function VisualAid({ visual }: { visual: Visual }) { return <section className={`visual-board ${visual.kind}`}><header><p className="eyebrow">VISUAL MODEL</p><h3>{visual.title}</h3></header><div>{visual.items.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></article>)}</div></section>; }

function DecisionCheckpoint({ depth }: { depth: DeepDay }) {
  const [choice, setChoice] = useState<number | null>(null); const settled = choice !== null;
  return <section className="decision-card"><div><p className="eyebrow">DECISION CHECKPOINT</p><h2>Choose before the explanation.</h2><p>{depth.decision.prompt}</p></div><div className="decision-options">{depth.decision.choices.map((option, index) => <button key={option} className={`${choice === index ? 'picked' : ''} ${settled && index === depth.decision.answer ? 'correct' : ''} ${settled && choice === index && index !== depth.decision.answer ? 'wrong' : ''}`} onClick={() => !settled && setChoice(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{settled && <aside className={choice === depth.decision.answer ? 'success' : 'correction'}><b>{choice === depth.decision.answer ? 'Good constraint matching.' : 'Use the stated constraint.'}</b><p>{depth.decision.rationale}</p></aside>}</section>;
}

function ActiveRecall({ depth }: { depth: DeepDay }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return <section className="recall-section"><header><p className="eyebrow">ACTIVE RECALL</p><h2>Retrieve it before you see it.</h2><p>Say or write your answer first. Then reveal the model answer and correct the gap.</p></header><div>{depth.recall.map((item, index) => <article key={item.prompt}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{item.prompt}</b>{open[index] && <p>{item.answer}</p>}</div><button onClick={() => setOpen((value) => ({ ...value, [index]: !value[index] }))}>{open[index] ? 'Hide' : 'Reveal'}</button></article>)}</div></section>;
}

function InlineScenario({ unit, onSaved }: { unit: DailyUnit; onSaved: () => void }) {
  const question = lessonScenario(unit);
  const [selected, setSelected] = useState<number | null>(null); const [saved, setSaved] = useState(false); const submitted = selected !== null;
  const answer = async (index: number) => { if (submitted) return; setSelected(index); const correct = index === question.correctAnswer; await db.attempts.put({ id: `studio:${unit.id}:${question.id}`, questionId: question.id, selectedAnswer: index, correct, durationSeconds: 0, mode: 'learning', createdAt: new Date().toISOString() }); setSaved(true); onSaved(); };
  return <section className="inline-scenario"><header><div><p className="eyebrow">GRADED SCENARIO</p><h2>Show the transfer.</h2></div><span>{question.difficulty} · {question.topic}</span></header><p className="scenario-stem">{question.statement}</p><div className="scenario-options">{question.options.map((option, index) => <button key={option} disabled={submitted} className={`${selected === index ? 'picked' : ''} ${submitted && index === question.correctAnswer ? 'correct' : ''} ${submitted && selected === index && index !== question.correctAnswer ? 'wrong' : ''}`} onClick={() => void answer(index)}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}</div>{submitted && <div className="scenario-review"><h3>{selected === question.correctAnswer ? 'Correct reasoning.' : 'Review the constraint you missed.'}</h3><p>{question.explanation}</p><div>{question.options.map((option, index) => index === question.correctAnswer ? null : <p key={option}><b>{String.fromCharCode(65 + index)}:</b> {question.distractorExplanations[index]}</p>)}</div>{saved && <small>Saved to your local performance signals.</small>}</div>}</section>;
}

export function DailyStudio() {
  const { day: param } = useParams(); const day = Number(param) || 1; const unit = unitByDay(day); const depth = academyDepth[day]; const state = useAcademyState();
  const [focus, setFocus] = useState(false); const [reflection, setReflection] = useState(''); const [scenarioDone, setScenarioDone] = useState(false);
  useEffect(() => { const question = lessonScenario(unit); void preference(`studio-reflection:${unit.id}`, '').then(setReflection); void db.attempts.get(`studio:${unit.id}:${question.id}`).then((attempt) => setScenarioDone(Boolean(attempt))); }, [unit]);
  const doneBlocks = new Set(state.blocks.filter((item) => item.unitId === unit.id).map((item) => item.blockId)); const allBlocks = unit.blocks.every((block) => doneBlocks.has(block.id)); const canComplete = allBlocks && scenarioDone;
  const completeBlock = async (blockId: string) => { if (doneBlocks.has(blockId)) return; await db.studyBlocks.put({ id: `${unit.id}:${blockId}`, unitId: unit.id, blockId, completedAt: new Date().toISOString() }); state.refresh(); };
  const completeDay = async () => { if (!canComplete) return; await db.dailyProgress.put({ id: unit.id, unitId: unit.id, completedAt: new Date().toISOString() }); await db.preferences.put({ key: 'pro-current-day', value: Math.min(30, unit.day + 1) }); state.refresh(); };
  const saveReflection = async () => { await db.preferences.put({ key: `studio-reflection:${unit.id}`, value: reflection.trim() }); };
  return <main className={`pro-page studio-page ${focus ? 'focus-mode' : ''}`}><section className="studio-hero"><div><Link className="crumb" to="/curriculum">Roadmap</Link><p className="eyebrow">DAY {String(unit.day).padStart(2, '0')} · {unit.priority} · {moduleName[unit.module]}</p><h1>{unit.title}</h1><p>{unit.subtitle}</p><div>{unit.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div><button className="quiet-button" onClick={() => setFocus((value) => !value)}>{focus ? 'Exit focus' : 'Focus mode'}</button></section>
    <section className="mission-banner"><span>MISSION</span><p>{depth.mission}</p><small>{unit.minutes} minute study session · complete the reading and one scenario to earn the day.</small></section>
    <div className="studio-frame"><aside className="studio-nav"><b>SESSION MAP</b><a href="#learn">01 Learn</a><a href="#case">02 Guided case</a><a href="#decide">03 Decide</a><a href="#recall">04 Retrieve</a><a href="#apply">05 Apply</a><a href="#reflect">06 Reflect</a><UnitStatus unit={unit} blocks={state.blocks} daily={state.daily} /></aside><article className="studio-content">
      <section id="learn" className="learning-section"><header><p className="eyebrow">GUIDED INSTRUCTION</p><h2>Build the model, not a definition list.</h2></header>{unit.blocks.map((block, index) => <article className="teaching-block" id={block.id} key={block.id}><header><span>BLOCK {String(index + 1).padStart(2, '0')}</span><button disabled={doneBlocks.has(block.id)} onClick={() => void completeBlock(block.id)}>{doneBlocks.has(block.id) ? 'Completed' : 'Mark studied'}</button></header><h3>{block.title}</h3><div className="block-copy"><div><b>Start here</b><p>{block.intuition}</p></div><div><b>Technical layer</b><p>{block.technical}</p></div></div><aside><span>WORKED EXAMPLE</span><p>{block.example}</p></aside></article>)}</section>
      <section id="case" className="case-study"><header><p className="eyebrow">GUIDED CASE</p><h2>{depth.caseTitle}</h2><p>{depth.caseContext}</p></header><ol>{depth.walkthrough.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section>
      <section id="decide"><DecisionCheckpoint depth={depth} /></section>
      <section id="visual"><VisualAid visual={unit.visual} /></section>
      <section id="recall"><ActiveRecall depth={depth} /></section>
      <section className="trap-card"><p className="eyebrow">CLOSE-DISTRACTOR TRAP</p><h2>What the assessment is actually testing</h2><p>{unit.trap}</p><small><b>Why it matters:</b> {unit.relevance}</small></section>
      <section id="apply"><InlineScenario unit={unit} onSaved={() => { setScenarioDone(true); state.refresh(); }} /></section>
      <section className="protocol-card"><header><p className="eyebrow">PRACTICE PROTOCOL</p><h2>Leave with something you did.</h2></header><ol>{depth.protocol.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol><p className="assignment"><b>Today's assignment:</b> {unit.assignment}</p><Link to={`/practice/${unit.practice.scenarioOnly ? 'scenarios' : 'mcq'}?subject=${unit.practice.module}`}>Open the extended practice workspace →</Link></section>
      <section id="reflect" className="reflection-card"><header><p className="eyebrow">REFLECT & RETAIN</p><h2>Write the rule you will use next time.</h2><p>{depth.reflection}</p></header><textarea aria-label="Daily reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} onBlur={() => void saveReflection()} placeholder="Example: A LEFT JOIN only preserves unmatched rows when right-side filters stay in the join condition." /><small>Saved only in this browser.</small><div className="revision-list">{unit.revision.map((item) => <span key={item}>{item}</span>)}</div><button className="complete-day" disabled={!canComplete} onClick={() => void completeDay()}>{state.daily.some((item) => item.unitId === unit.id) ? 'Day complete' : canComplete ? 'Complete day and continue →' : !allBlocks ? `Study all ${unit.blocks.length} blocks first` : 'Answer the graded scenario first'}</button></section>
      <footer className="lesson-sources"><p className="eyebrow">REFERENCES</p>{unit.references.length ? unit.references.map((reference) => <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer">{reference.label} ↗</a>) : <span>Lesson practice is self-contained; use the linked Lab for additional applied questions.</span>}</footer>
    </article></div></main>;
}

export function AcademyAnalytics() {
  const state = useAcademyState(); const rows = (['ai', 'technical', 'communication', 'reasoning'] as ModuleId[]).map((module) => ({ module, attempts: state.attempts.filter((item) => questions.find((q) => q.id === item.questionId)?.module === module) }));
  const timed = state.attempts.filter((item) => item.mode === 'assessment'); const averageTime = state.attempts.length ? Math.round(state.attempts.reduce((sum, item) => sum + item.durationSeconds, 0) / state.attempts.length) : 0;
  return <main className="pro-page analytics-page"><section className="page-intro"><p className="eyebrow">PERFORMANCE SIGNALS</p><h1>Evidence, not theatre.</h1><p>Every number comes from a saved response in this browser. Personal mastery bands are learning guides, never employer cutoffs.</p></section><section className="metric-board">{rows.map((row) => <article key={row.module}><span>{moduleName[row.module]}</span><b>{accuracy(row.attempts)}%</b><p>{scoreLabel(accuracy(row.attempts))} · {row.attempts.length} responses</p><i><em style={{ width: `${accuracy(row.attempts)}%` }} /></i></article>)}<article><span>Average response time</span><b>{averageTime ? `${averageTime}s` : '—'}</b><p>{timed.length} timed responses</p></article><article><span>Scenario accuracy</span><b>{accuracy(state.attempts.filter((item) => questions.find((q) => q.id === item.questionId)?.kind === 'scenario'))}%</b><p>Applied transfer score</p></article></section><section className="analytics-explainer"><article><p className="eyebrow">HOW TO READ THIS</p><h2>Choose a next action, not a label.</h2><ul><li>Under 60%: revisit the decision rule, then attempt a fresh scenario.</li><li>60–79%: practise mixed contexts and check speed.</li><li>80–89%: retain with spaced retests.</li><li>90%+: move to a neighbouring trade-off or teach it aloud.</li></ul></article><article><p className="eyebrow">NEXT BEST MOVE</p><h2>{state.attempts.length ? 'Use your mistake notebook to select the lowest-confidence concept.' : 'Create a first signal.'}</h2><p>{state.attempts.length ? 'A score alone does not show why an answer was missed. Read the explanation, name the ignored constraint, then retest in a new context.' : 'Complete a day’s in-lesson scenario or a focused practice set. Recommendations appear once there is enough genuine evidence.'}</p><Link to={state.attempts.length ? '/mistakes' : '/practice/scenarios'}>{state.attempts.length ? 'Open revision queue →' : 'Start a scenario set →'}</Link></article></section></main>;
}

export function AcademyIntelligence() {
  const [filter, setFilter] = useState<'all' | 'Official' | 'Repeated firsthand' | 'Single firsthand' | 'Preparation inference' | 'Unverified'>('all'); const visible = evidence.filter((item) => filter === 'all' || item.level === filter);
  return <main className="pro-page intel-page"><section className="page-intro"><p className="eyebrow">ASSESSMENT INTELLIGENCE</p><h1>Signals with boundaries.</h1><p>Candidate accounts can guide preparation priorities. They cannot establish your campus’s cutoffs, sequence, package mapping, or platform configuration.</p></section><section className="stage-board">{assessmentStages.map(([stage, note, status], index) => <article key={stage}><span>{String(index + 1).padStart(2, '0')} · {status}</span><h2>{stage}</h2><p>{note}</p></article>)}</section><section className="evidence-toolbar"><div><b>Evidence confidence</b><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">All records</option><option value="Official">Official</option><option value="Repeated firsthand">Repeated firsthand</option><option value="Single firsthand">Single firsthand</option><option value="Preparation inference">Preparation inference</option><option value="Unverified">Unverified</option></select></div><p><b>Unresolved claim:</b> “RRP” remains unexpanded. The academy deliberately does not invent an answer.</p></section><section className="evidence-list">{visible.map((item) => <article key={item.id}><header><span>{item.level} · {item.confidence} confidence</span><small>{item.published}</small></header><h2><a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a></h2><p>{item.notes}</p><footer>{item.topics.map((topic) => <span key={topic}>{topic}</span>)}</footer></article>)}</section></main>;
}
