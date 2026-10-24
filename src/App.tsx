import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { aiCodingChallenges, debuggingChallenges } from './data/challenges';
import { DebuggingLab } from './components/DebuggingLab';
import { IndependentResearchBank } from './components/IndependentResearchBank';
import { AssessmentIntelligence, Curriculum, InterviewPrep, LessonReader, ProHome } from './components/ProMode';
import { AcademyAnalytics, AcademyDashboard, AcademyIntelligence, AcademyRoadmap, DailyStudio, ProShell } from './components/ProAcademy';
import { questions } from './data/questions';
import { db, preference, type Note } from './lib/db';
import { accuracy, pickMock, promptRubric, scoreQuestions, shuffle } from './lib/engine';
import type { Attempt, ModuleId, Question } from './types';

const labels: Record<ModuleId, string> = { ai: 'AI Literacy', technical: 'Technical', communication: 'Communication', reasoning: 'Logical Reasoning' };
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function Layout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme === 'dark' : false));
  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'light';
    preference('theme', saved).then((theme) => {
      setDark(theme === 'dark');
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
  const links = [['/', 'Lab'], ['/pro', 'Pro Mode'], ['/curriculum', 'Curriculum'], ['/module/ai', 'AI'], ['/module/technical', 'Technical'], ['/practice/scenarios', 'Scenarios'], ['/mock-test', 'Mock'], ['/assessment-pattern', 'Intelligence'], ['/analytics', 'Analytics'], ['/settings', 'Settings']];
  return <><header><Link className="brand" to="/">Exceller <b>Lab</b></Link><nav>{links.map(([to, name]) => <NavLink key={to} to={to} end={to === '/'}>{name}</NavLink>)}</nav><button className="icon-button" onClick={toggle} aria-label="Toggle color theme">{dark ? '☀️ Light' : '🌙 Dark'}</button></header><main>{children}</main></>;
}

function AcademyAwareLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pro = ['/pro', '/dashboard', '/curriculum', '/learn/', '/practice/', '/mock-test', '/analytics', '/mistakes', '/interview', '/assessment-pattern', '/settings'];
  return pro.some((path) => path.endsWith('/') ? location.pathname.startsWith(path) : location.pathname === path) ? <ProShell>{children}</ProShell> : <Layout>{children}</Layout>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Dashboard() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => { db.attempts.toArray().then(setAttempts); }, []);
  const by = (module: ModuleId) => accuracy(attempts.filter((a) => questions.find((q) => q.id === a.questionId)?.module === module));
  return <div className="page"><section className="hero-panel"><p className="eyebrow">CAPGEMINI EXCELLER 2027</p><h1>Prepare by doing.</h1><p>Timed practice, answer review, structured AI collaboration, and genuine local progress tracking.</p><Link className="button" to="/mocks">Start official-style mock â†’</Link></section><section className="metric-grid"><Metric label="Questions attempted" value={attempts.length} /><Metric label="Accuracy" value={`${accuracy(attempts)}%`} /><Metric label="Practice inventory" value={questions.length + debuggingChallenges.length + aiCodingChallenges.length} /><Metric label="Storage" value="Local" /></section><section className="split"><article className="panel"><p className="eyebrow">READINESS</p><h2>Train the weakest area next</h2><div className="readiness">{(Object.keys(labels) as ModuleId[]).map((module) => <div key={module}><span>{labels[module]}</span><b>{by(module)}%</b><i><em style={{ width: `${by(module)}%` }} /></i></div>)}</div></article><article className="panel official"><p className="eyebrow">CONFIRMED MAP</p><h2>Five assessment stages</h2><ol><li>English Communication</li><li>Technical Module â€” 40 MCQs / ~45 min</li><li>Debugging â€” 1 task / ~20 min</li><li>AI-assisted Coding</li><li>Cognitive Assessment</li></ol><Link to="/research">Evidence and boundaries â†’</Link></article></section></div>;
}

type QuizProps = { initial: Question[]; title: string; durationSeconds?: number; initialMode?: 'learning' | 'assessment'; questionCount?: number };
function Quiz({ initial, title, durationSeconds, initialMode = 'learning', questionCount = 20 }: QuizProps) {
  const [mode, setMode] = useState<'learning' | 'assessment'>(initialMode);
  const [items, setItems] = useState(() => shuffle(initial).slice(0, Math.min(questionCount, initial.length)));
  const [index, setIndex] = useState(0); const [answers, setAnswers] = useState<Record<string, number>>({}); const [marked, setMarked] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false); const [started, setStarted] = useState(Date.now()); const [remaining, setRemaining] = useState(durationSeconds ?? 0);
  const q = items[index];
  const saveMistake = async (item: Question, selected: number, createdAt: string) => { if (selected === item.correctAnswer) return; await db.notes.put({ id: `mistake:${item.id}`, questionId: item.id, text: `Missed ${item.topic} â€” selected ${'ABCD'[selected]}, correct ${'ABCD'[item.correctAnswer]}. Review: ${item.concept}`, createdAt }); await db.revisions.put({ id: `revision:${item.id}`, questionId: item.id, topic: item.subtopic, createdAt, dueAt: new Date(Date.now() + 86400000).toISOString() }); };
  const submit = useCallback(async () => { if (submitted) return; const createdAt = new Date().toISOString(); await Promise.all(items.filter((item) => answers[item.id] !== undefined).flatMap((item) => [db.attempts.put({ id: crypto.randomUUID(), questionId: item.id, selectedAnswer: answers[item.id], correct: answers[item.id] === item.correctAnswer, durationSeconds: Math.round((Date.now() - started) / 1000 / Math.max(1, items.length)), mode, createdAt }), saveMistake(item, answers[item.id], createdAt)])); setSubmitted(true); }, [answers, items, mode, started, submitted]);
  useEffect(() => { if (!durationSeconds || mode !== 'assessment' || submitted) return; const timer = window.setInterval(() => setRemaining((now) => { if (now <= 1) { void submit(); return 0; } return now - 1; }), 1000); return () => window.clearInterval(timer); }, [durationSeconds, mode, submitted, submit]);
  if (!q) return <p>No questions available.</p>;
  const answered = answers[q.id] !== undefined;
  const choose = (choice: number) => { if (submitted) return; setAnswers((old) => ({ ...old, [q.id]: choice })); if (mode === 'learning') { const createdAt = new Date().toISOString(); void db.attempts.put({ id: crypto.randomUUID(), questionId: q.id, selectedAnswer: choice, correct: choice === q.correctAnswer, durationSeconds: Math.round((Date.now() - started) / 1000), mode, createdAt }); void saveMistake(q, choice, createdAt); } };
  const reset = () => { setItems(shuffle(initial).slice(0, Math.min(questionCount, initial.length))); setIndex(0); setAnswers({}); setMarked([]); setSubmitted(false); setStarted(Date.now()); setRemaining(durationSeconds ?? 0); };
  const reveal = submitted || (mode === 'learning' && answered);
  return <section className="quiz"><div className="quiz-top"><div><p className="eyebrow">{title} Â· {mode.toUpperCase()}</p><h2>Question {index + 1} of {items.length}</h2></div><div className="timer-area">{durationSeconds && <b className={remaining < 60 ? 'timer urgent' : 'timer'}>â± {formatTime(remaining)}</b>}<label className="toggle">Learning<input type="checkbox" checked={mode === 'assessment'} onChange={(event) => setMode(event.target.checked ? 'assessment' : 'learning')} />Assessment</label></div></div><div className="palette">{items.map((item, itemIndex) => <button key={item.id} className={`${itemIndex === index ? 'active' : ''} ${answers[item.id] !== undefined ? 'answered' : ''} ${marked.includes(item.id) ? 'marked' : ''}`} onClick={() => setIndex(itemIndex)}>{itemIndex + 1}</button>)}</div><article className="question"><p className="chip">{q.topic} Â· {q.difficulty}</p><h3>{q.statement}</h3><div className="options">{q.options.map((option, optionIndex) => { const state = reveal ? (optionIndex === q.correctAnswer ? 'correct' : optionIndex === answers[q.id] ? 'wrong' : '') : optionIndex === answers[q.id] ? 'chosen' : ''; return <button key={option} className={state} onClick={() => choose(optionIndex)}><b>{'ABCD'[optionIndex]}</b>{option}</button>; })}</div>{reveal && <div className="explanation"><b>Why the best answer works:</b> {q.explanation}<p><b>Why the other options fail:</b></p><ul>{q.distractorExplanations.map((reason, reasonIndex) => <li key={reasonIndex}>{reason}</li>)}</ul><p><b>Key concept:</b> {q.concept}</p></div>}</article><footer className="quiz-actions"><button className="text" onClick={() => setMarked((old) => old.includes(q.id) ? old.filter((id) => id !== q.id) : [...old, q.id])}>{marked.includes(q.id) ? 'Unmark review' : 'Mark for review'}</button><span>{Object.keys(answers).length}/{items.length} answered</span>{submitted ? <><strong>{scoreQuestions(items, answers)}/{items.length} correct</strong><button className="button" onClick={reset}>Try another set</button></> : <><button className="text" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>â† Previous</button>{index < items.length - 1 ? <button className="button" onClick={() => setIndex((value) => value + 1)}>Next â†’</button> : <button className="button" onClick={() => void submit()}>Submit assessment</button>}</>}</footer></section>;
}

function PracticeCenter({ scenarios = false }: { scenarios?: boolean }) {
  const [params] = useSearchParams();
  const [module, setModule] = useState<'all' | ModuleId>((params.get('subject') as ModuleId) || 'all');
  const [difficulty, setDifficulty] = useState<'all' | Question['difficulty']>('all');
  const [count, setCount] = useState(10);
  const filtered = questions.filter((question) => (!scenarios || question.kind === 'scenario') && (module === 'all' || question.module === module) && (difficulty === 'all' || question.difficulty === difficulty));
  return <div className="page"><section className="page-title"><p className="eyebrow">{scenarios ? 'SCENARIO MCQ ARENA' : 'MCQ PRACTICE CENTER'}</p><h1>{scenarios ? 'Make the engineering call.' : 'Focus practice, then explain it.'}</h1><p>{scenarios ? 'Original scenario and multi-concept practice. Answers remain hidden until you choose in Learning mode or submit in Assessment mode.' : 'Filter the deterministic local question bank by subject and difficulty.'}</p></section><div className="filters"><select aria-label="Subject" value={module} onChange={(event) => setModule(event.target.value as 'all' | ModuleId)}><option value="all">All subjects</option>{(Object.keys(labels) as ModuleId[]).map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select><select aria-label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as 'all' | Question['difficulty'])}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><select aria-label="Question count" value={count} onChange={(event) => setCount(Number(event.target.value))}><option value={10}>10 questions</option><option value={20}>20 questions</option><option value={30}>30 questions</option></select></div>{filtered.length ? <Quiz key={`${scenarios}-${module}-${difficulty}-${count}`} initial={filtered} title={scenarios ? 'Scenario challenge' : 'Focused MCQ practice'} questionCount={count} /> : <article className="panel">No questions match those filters yet. Pick another difficulty or subject.</article>}</div>;
}

function ModulePage() { const { module = 'ai' } = useParams(); const id = (Object.keys(labels) as string[]).includes(module) ? module as ModuleId : 'ai'; const bank = questions.filter((question) => question.module === id); return <div className="page"><section className="page-title"><p className="eyebrow">LEARNING MODULE</p><h1>{labels[id]}</h1><p>{bank.length} typed practice questions, including research-informed original scenarios. Feedback appears immediately only in Learning mode.</p></section><Quiz key={id} initial={bank} title={labels[id]} /></div>; }
function Mocks() { const navigate = useNavigate(); const [preset, setPreset] = useState<'ai' | 'technical' | 'combined'>('combined'); const preview = useMemo(() => pickMock(questions, preset), [preset]); const details = { ai: '20 questions Â· 22:30', technical: '20 questions Â· 22:30', combined: '40 questions Â· 45:00' }; return <div className="page"><section className="page-title"><p className="eyebrow">TIMED EXAMINATION ENGINE</p><h1>Mock exams</h1><p>Assessment mode hides answers until you submit or time expires. Practice scoring is +1 / 0.</p></section><div className="mock-grid">{(['ai', 'technical', 'combined'] as const).map((id) => <button key={id} className={`mock-card ${preset === id ? 'selected' : ''}`} onClick={() => setPreset(id)}><span>{details[id]}</span><h2>{id === 'combined' ? 'Official-style combined' : labels[id]}</h2><p>Randomized from the validated local bank.</p></button>)}</div><article className="panel action-panel"><div><h2>{details[preset]} practice timer</h2><p>Question palette, review flags, persistence, and post-submit review.</p></div><button className="button" onClick={() => navigate(`/mock/${preset}`)}>Launch mock â†’</button></article><Quiz key={`preview-${preset}`} initial={preview} title={`${preset} preview`} /></div>; }
function TimedMock() { const { kind = 'combined' } = useParams(); const [params] = useSearchParams(); const preset = kind === 'ai' || kind === 'technical' || kind === 'combined' ? kind : 'combined'; const requestedMinutes = Number(params.get('minutes')); const durationSeconds = (requestedMinutes >= 40 && requestedMinutes <= 50 ? requestedMinutes * 60 : preset === 'combined' ? 2700 : 1350); return <div className="page"><Quiz key={`mock-${preset}-${durationSeconds}`} initial={pickMock(questions, preset)} title={`${preset} mock`} initialMode="assessment" durationSeconds={durationSeconds} questionCount={preset === 'combined' ? 40 : 20} /></div>; }
function MockTestSetup() { const navigate = useNavigate(); const [minutes, setMinutes] = useState(45); return <div className="pro-page"><header className="pro-title"><p className="pro-kicker">FULL MOCK TEST</p><h1>40 original questions. One focused run.</h1><p>This is a practice simulator based on candidate-reported broad structure, not Capgemini software or scoring.</p></header><section className="mock-setup"><div><b>Composition</b><p>20 AI Literacy + 20 Technical. Questions are randomized from the validated local bank.</p></div><label>Timer<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value={40}>40 minutes</option><option value={45}>45 minutes (default)</option><option value={50}>50 minutes</option></select></label><div><b>During the test</b><p>Flag questions, use the palette, and submit when ready. Explanations unlock after submission.</p></div><button className="pro-button" onClick={() => navigate(`/mock/combined?minutes=${minutes}`)}>Start timed mock â†’</button></section></div>; }

function Debugging() { const [challenge, setChallenge] = useState(debuggingChallenges[0]); const [code, setCode] = useState(challenge.starterCode); const [output, setOutput] = useState(''); const [status, setStatus] = useState('Checking local runnerâ€¦'); useEffect(() => { fetch('/api/runner/status', { method: 'POST' }).then((response) => response.json()).then((body) => setStatus(body.available ? 'Docker runner ready' : body.reason)).catch(() => setStatus('Local API is not running.')); }, []); const run = async () => { setOutput('Running in restricted Docker containerâ€¦'); try { const response = await fetch('/api/runner/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: challenge.language, code, input: challenge.publicTests[0].input }) }); const json = await response.json(); setOutput(json.error ?? `Exit ${json.exitCode}\n${json.stdout ?? ''}\n${json.stderr ?? ''}`); } catch { setOutput('The local API is unavailable. Start it with npm run dev.'); } }; const select = (id: string) => { const next = debuggingChallenges.find((item) => item.id === id)!; setChallenge(next); setCode(next.starterCode); setOutput(''); }; return <div className="page"><section className="page-title"><p className="eyebrow">DEBUGGING LAB Â· REVIEW â†’ IDENTIFY â†’ FIX â†’ VALIDATE</p><h1>Fix real bugs.</h1><p>Code runs only through the configured local Docker sandbox. Status: <b>{status}</b></p></section><div className="workspace"><aside><label>Challenge<select value={challenge.id} onChange={(event) => select(event.target.value)}>{debuggingChallenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><h2>{challenge.title}</h2><p>{challenge.statement}</p><h3>Public test</h3><pre>{challenge.publicTests[0].input} â†’ {challenge.publicTests[0].expected}</pre><p className="chip">{challenge.bugMetadata.join(' Â· ')}</p></aside><section><textarea aria-label="Code editor" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} /><div className="editor-actions"><button className="button" onClick={() => void run()}>Run public test</button><button className="text" onClick={() => setOutput(`Reference solution\n${challenge.referenceSolution}`)}>Reveal after attempt</button></div><pre className="terminal">{output || 'Runner output appears here.'}</pre></section></div></div>; }

function AICoding() { const [challenge, setChallenge] = useState(aiCodingChallenges[0]); const [prompt, setPrompt] = useState(''); const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]); const [used, setUsed] = useState(0); const [state, setState] = useState(''); const remaining = 2000 - used; const rubric = promptRubric(prompt); const send = async () => { if (!prompt.trim() || remaining <= 0) return; setState('Counting tokens and requesting Geminiâ€¦'); try { const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: prompt, history: messages, remainingTokens: remaining }) }); const json = await response.json(); if (!response.ok) { setState(json.error); return; } setMessages((old) => [...old, { role: 'user', text: prompt }, { role: 'model', text: json.text }]); setUsed((old) => Math.min(2000, old + json.usage.totalTokens)); setPrompt(''); setState(''); } catch { setState('Local Gemini API is unavailable. Add GEMINI_API_KEY to .env, then run npm run dev.'); } }; return <div className="page"><section className="page-title"><p className="eyebrow">AI-ASSISTED CODING LAB</p><h1>Show your reasoning.</h1><p>Gemini runs server-side with a 2,000-token challenge budget.</p></section><div className="ai-grid"><aside><label>Challenge<select value={challenge.id} onChange={(event) => { const next = aiCodingChallenges.find((item) => item.id === event.target.value)!; setChallenge(next); setMessages([]); setUsed(0); }}>{aiCodingChallenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><h2>{challenge.title}</h2><p>{challenge.statement}</p><h3>Prompt rubric</h3>{Object.entries(rubric.checks).map(([name, pass]) => <p key={name}>{pass ? 'âœ“' : 'â—‹'} {name}</p>)}<strong>{rubric.score}/100 prompt completeness</strong></aside><section className="chat"><div className="budget"><span>Gemini challenge budget</span><b>{remaining} tokens remaining</b><small>{messages.filter((message) => message.role === 'user').length} prompts Â· {used} used</small></div><div className="messages">{messages.length ? messages.map((message, index) => <article key={index} className={message.role}><b>{message.role === 'user' ? 'You' : 'Gemini'}</b><p>{message.text}</p></article>) : <p className="empty">Start by restating inputs, outputs, constraints, and edge cases.</p>}</div><textarea aria-label="Message Gemini" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Write a structured promptâ€¦" /><div className="editor-actions"><span className="error">{state}</span><button className="button" disabled={!prompt.trim() || remaining <= 0} onClick={() => void send()}>Ask Gemini â†’</button></div></section><aside><h3>Candidate code</h3><textarea aria-label="Candidate code" className="code-mini" defaultValue={challenge.starterCode} /><p>Use the Debugging Lab runner to compile code locally. This chat never claims code execution.</p></aside></div></div>; }

function Explorer() { const [module, setModule] = useState<'all' | ModuleId>('all'); const [query, setQuery] = useState(''); const result = questions.filter((question) => (module === 'all' || question.module === module) && `${question.topic} ${question.subtopic} ${question.statement}`.toLowerCase().includes(query.toLowerCase())); return <div className="page"><section className="page-title"><p className="eyebrow">QUESTION BANK EXPLORER</p><h1>Find focused practice.</h1></section><div className="filters"><input aria-label="Search questions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search RAG, SQL, graphsâ€¦" /><select value={module} onChange={(event) => setModule(event.target.value as 'all' | ModuleId)}><option value="all">All modules</option>{(Object.keys(labels) as ModuleId[]).map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></div><div className="question-list">{result.slice(0, 40).map((question) => <article key={question.id}><p className="chip">{labels[question.module]} Â· {question.difficulty} Â· {question.provenance}</p><h3>{question.statement}</h3><p>{question.concept}</p></article>)}</div></div>; }

function Analytics() { const [attempts, setAttempts] = useState<Attempt[]>([]); useEffect(() => { db.attempts.toArray().then(setAttempts); }, []); return <div className="page"><section className="page-title"><p className="eyebrow">LOCAL ANALYTICS</p><h1>Progress based on actual attempts.</h1></section><section className="metric-grid"><Metric label="Recorded choices" value={attempts.length} /><Metric label="Correct" value={attempts.filter((attempt) => attempt.correct).length} /><Metric label="Accuracy" value={`${accuracy(attempts)}%`} /><Metric label="Assessment mode" value={attempts.filter((attempt) => attempt.mode === 'assessment').length} /></section><article className="panel"><h2>Module readiness</h2><div className="readiness">{(Object.keys(labels) as ModuleId[]).map((module) => { const relevant = attempts.filter((attempt) => questions.find((question) => question.id === attempt.questionId)?.module === module); return <div key={module}><span>{labels[module]}</span><b>{accuracy(relevant)}%</b><i><em style={{ width: `${accuracy(relevant)}%` }} /></i></div>; })}</div></article></div>; }
function Notebook() { const [notes, setNotes] = useState<Note[]>([]); const [text, setText] = useState(''); const refresh = () => void db.notes.orderBy('createdAt').reverse().toArray().then(setNotes); useEffect(refresh, []); const add = async () => { if (!text.trim()) return; await db.notes.put({ id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() }); setText(''); refresh(); }; return <div className="page"><section className="page-title"><p className="eyebrow">MISTAKE NOTEBOOK</p><h1>Turn wrong answers into revision.</h1><p>Incorrect answers are collected automatically. Add your own reasoning gap when a pattern is worth remembering.</p></section><article className="panel"><textarea aria-label="New notebook note" className="note-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Example: I missed graph traversal because I did not state the visited invariant first." /><button className="button" onClick={() => void add()}>Save note</button></article><div className="question-list">{notes.length ? notes.map((note) => { const question = note.questionId ? questions.find((item) => item.id === note.questionId) : undefined; return <article key={note.id}><p className="chip">{new Date(note.createdAt).toLocaleString()} {question ? ` Â· ${question.subtopic}` : ''}</p><p>{note.text}</p>{question && <Link className="text" to={`/practice/${question.kind === 'scenario' ? 'scenarios' : 'mcq'}?subject=${question.module}`}>Retest this topic</Link>}<button className="text" onClick={() => void db.notes.delete(note.id).then(refresh)}>Delete</button></article>; }) : <article className="panel">No mistakes recorded yet. Complete a practice question to start your review queue.</article>}</div></div>; }
function Research() { return <div className="page"><section className="page-title"><p className="eyebrow">RESEARCH & EVIDENCE</p><h1>What is confirmed.</h1><p>The supplied Capgemini Exceller Assessment Framework V2 deck is the primary source.</p></section><article className="panel"><h2>Official framework</h2><ul><li>Five stages: English Communication, Technical Module, Debugging, AI-assisted Coding, Cognitive.</li><li>Technical: two 20-question sections, about 45 minutes total.</li><li>Debugging: one C/C++/Java task, about 20 minutes.</li><li>AI coding assesses AI literacy, prompt quality, problem-solving, and review/adaptation.</li><li>Motion and Grid challenges are documented but intentionally not recreated here.</li></ul></article><article className="panel"><h2>Imported research banks</h2><p>Two supplied research packs add 212 original research-informed MCQs, 14 debugging challenges, and 20 AI-assisted coding exercises. Their questions remain explicitly marked as reconstructed or candidate-reported practice, never as leaked or official exam wording.</p></article><article className="panel"><h2>Evidence labels</h2><p><b>OFFICIAL</b> comes from employer material. <b>CANDIDATE_REPORTED</b> is useful but uncertain. <b>RECONSTRUCTED</b> and <b>PREDICTED</b> identify authored, syllabus-aligned practice. No question claims to be leaked exam content.</p></article></div>; }
function Settings() {
  const [count, setCount] = useState(0);
  const [plan, setPlan] = useState(30);
  const [hours, setHours] = useState(2.5);
  const [target, setTarget] = useState('₹11 LPA aspiration');
  const [language, setLanguage] = useState('C++');
  const [cognitive, setCognitive] = useState(true);
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light'));
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.attempts.count().then(setCount);
    void Promise.all([
      preference('pro-plan-days', 30),
      preference('study-hours', 2.5),
      preference('target-track', '₹11 LPA aspiration'),
      preference('language', 'C++'),
      preference('cognitive', true),
      preference('theme', (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'light'),
    ]).then(([nextPlan, nextHours, nextTarget, nextLanguage, nextCognitive, nextTheme]) => {
      setPlan(nextPlan);
      setHours(nextHours);
      setTarget(nextTarget);
      setLanguage(nextLanguage);
      setCognitive(nextCognitive);
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    });
  }, []);

  const changeTheme = async (nextTheme: string) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try { localStorage.setItem('theme', nextTheme); } catch (e) {}
    await db.preferences.put({ key: 'theme', value: nextTheme });
  };

  const save = async () => {
    await db.preferences.bulkPut([
      { key: 'pro-plan-days', value: plan },
      { key: 'study-hours', value: hours },
      { key: 'target-track', value: target },
      { key: 'language', value: language },
      { key: 'cognitive', value: cognitive },
      { key: 'theme', value: theme },
    ]);
  };

  const download = async () => {
    const payload = {
      attempts: await db.attempts.toArray(),
      sessions: await db.sessions.toArray(),
      notes: await db.notes.toArray(),
      preferences: await db.preferences.toArray(),
      lessonProgress: await db.lessonProgress.toArray(),
      revisions: await db.revisions.toArray(),
      studyBlocks: await db.studyBlocks.toArray(),
      dailyProgress: await db.dailyProgress.toArray()
    };
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    link.download = 'exceller-practice-progress.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const restore = async (file?: File) => {
    if (!file) return;
    const data = JSON.parse(await file.text());
    await db.transaction('rw', [db.attempts, db.sessions, db.notes, db.preferences, db.lessonProgress, db.revisions, db.studyBlocks, db.dailyProgress], async () => {
      if (Array.isArray(data.attempts)) await db.attempts.bulkPut(data.attempts);
      if (Array.isArray(data.sessions)) await db.sessions.bulkPut(data.sessions);
      if (Array.isArray(data.notes)) await db.notes.bulkPut(data.notes);
      if (Array.isArray(data.preferences)) await db.preferences.bulkPut(data.preferences);
      if (Array.isArray(data.lessonProgress)) await db.lessonProgress.bulkPut(data.lessonProgress);
      if (Array.isArray(data.revisions)) await db.revisions.bulkPut(data.revisions);
      if (Array.isArray(data.studyBlocks)) await db.studyBlocks.bulkPut(data.studyBlocks);
      if (Array.isArray(data.dailyProgress)) await db.dailyProgress.bulkPut(data.dailyProgress);
    });
    setCount(await db.attempts.count());
  };

  return (
    <div className="page">
      <section className="page-title">
        <p className="eyebrow">SETTINGS & PRIVACY</p>
        <h1>Tailor Pro Mode.</h1>
        <p>{count} attempts are stored in browser IndexedDB; no account is required.</p>
      </section>
      <article className="panel settings-grid">
        <label>
          Color theme
          <select value={theme} onChange={(event) => void changeTheme(event.target.value)}>
            <option value="light">☀️ Light mode</option>
            <option value="dark">🌙 Dark mode (High contrast)</option>
          </select>
        </label>
        <label>
          Target track
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            <option>₹11 LPA aspiration</option>
            <option>₹7–7.5 LPA aspiration</option>
          </select>
        </label>
        <label>
          Preparation duration
          <select value={plan} onChange={(event) => setPlan(Number(event.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
        <label>
          Daily study time
          <select value={hours} onChange={(event) => setHours(Number(event.target.value))}>
            <option value={2}>2 hours</option>
            <option value={2.5}>2.5 hours</option>
            <option value={3}>3 hours</option>
          </select>
        </label>
        <label>
          Preferred coding language
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option>C++</option>
            <option>Python</option>
            <option>Java</option>
          </select>
        </label>
        <label className="toggle">
          Include reported cognitive modules
          <input type="checkbox" checked={cognitive} onChange={(event) => setCognitive(event.target.checked)} />
        </label>
        <button className="button" onClick={() => void save()}>Save learning preferences</button>
      </article>
      <article className="panel">
        <h2>Backup or restore progress</h2>
        <p>Transfer attempts, lessons, revision items, notes, and preferences as JSON.</p>
        <div className="editor-actions">
          <button className="button" onClick={() => void download()}>Export local data</button>
          <input ref={fileInput} type="file" accept="application/json" onChange={(event) => void restore(event.target.files?.[0])} />
        </div>
      </article>
      <article className="panel">
        <h2>Runtime configuration</h2>
        <p>Gemini requires GEMINI_API_KEY in .env. Code execution requires Docker Desktop and DOCKER_ENABLED=true. Credentials never ship to the browser.</p>
      </article>
    </div>
  );
}

export function App() { return <AcademyAwareLayout><Routes><Route path="/" element={<Dashboard />} /><Route path="/pro" element={<AcademyDashboard />} /><Route path="/dashboard" element={<AcademyDashboard />} /><Route path="/assessment-pattern" element={<AcademyIntelligence />} /><Route path="/curriculum" element={<AcademyRoadmap />} /><Route path="/learn/:module/:lesson" element={<LessonReader />} /><Route path="/learn/:day" element={<DailyStudio />} /><Route path="/practice/scenarios" element={<PracticeCenter scenarios />} /><Route path="/practice/mcq" element={<PracticeCenter />} /><Route path="/practice/debugging" element={<DebuggingLab />} /><Route path="/practice/ai-coding" element={<AICoding />} /><Route path="/mock-test" element={<MockTestSetup />} /><Route path="/interview" element={<InterviewPrep />} /><Route path="/module/:module" element={<ModulePage />} /><Route path="/mocks" element={<Mocks />} /><Route path="/mock/:kind" element={<TimedMock />} /><Route path="/debugging" element={<DebuggingLab />} /><Route path="/ai-coding" element={<AICoding />} /><Route path="/research-bank" element={<IndependentResearchBank />} /><Route path="/explorer" element={<Explorer />} /><Route path="/analytics" element={<AcademyAnalytics />} /><Route path="/notebook" element={<Notebook />} /><Route path="/mistakes" element={<Notebook />} /><Route path="/research" element={<Research />} /><Route path="/settings" element={<Settings />} /><Route path="*" element={<ProHome />} /></Routes></AcademyAwareLayout>; }




