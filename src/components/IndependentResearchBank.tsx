import { useMemo, useState } from 'react';
import { questions } from '../data/questions';
import type { ModuleId, Question } from '../types';
import { shuffle } from '../lib/engine';
import './independent-research-bank.css';

const bank = questions.filter((question) => question.id.startsWith('independent-research-'));
const labels: Record<'all' | ModuleId, string> = { all: 'All research questions', ai: 'AI Literacy', technical: 'Technical', communication: 'Communication', reasoning: 'Logical Reasoning' };

export function IndependentResearchBank() {
  const [module, setModule] = useState<'all' | ModuleId>('all');
  const [seed, setSeed] = useState(0); const [index, setIndex] = useState(0); const [selected, setSelected] = useState<number | null>(null);
  const filtered = useMemo(() => shuffle(bank.filter((question) => module === 'all' || question.module === module)), [module, seed]);
  const question: Question | undefined = filtered[index % Math.max(1, filtered.length)];
  const next = () => { setIndex((value) => value + 1); setSelected(null); };
  const reset = (nextModule: 'all' | ModuleId) => { setModule(nextModule); setIndex(0); setSelected(null); setSeed((value) => value + 1); };
  if (!question) return <div className="page"><p>No independent research questions are available.</p></div>;
  const reveal = selected !== null;
  return <div className="page"><section className="page-title"><p className="eyebrow">INDEPENDENT RESEARCH BANK</p><h1>Reddit & Glassdoor-informed practice.</h1><p>These 88 original scenario questions were authored from independently reported themes. They are not official or recovered assessment questions.</p></section><div className="research-bank-toolbar"><label>Focus area<select value={module} onChange={(event) => reset(event.target.value as 'all' | ModuleId)}>{(Object.keys(labels) as ('all' | ModuleId)[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}</select></label><span>{filtered.length} questions · candidate-reported context</span><button className="text" onClick={() => { setSeed((value) => value + 1); setIndex(0); setSelected(null); }}>Shuffle set</button></div><section className="quiz research-quiz"><div className="quiz-top"><div><p className="eyebrow">{labels[module].toUpperCase()} · QUESTION {index + 1}</p><h2>{question.topic}</h2></div><span className="chip">CANDIDATE-REPORTED CONTEXT</span></div><article className="question"><h3>{question.statement}</h3><div className="options">{question.options.map((option, optionIndex) => { const state = reveal ? (optionIndex === question.correctAnswer ? 'correct' : optionIndex === selected ? 'wrong' : '') : optionIndex === selected ? 'chosen' : ''; return <button key={option} className={state} onClick={() => setSelected(optionIndex)} disabled={reveal}><b>{'ABCD'[optionIndex]}</b>{option}</button>; })}</div>{reveal && <div className="explanation"><b>Why:</b> {question.explanation}<p><b>Practice provenance:</b> Original scenario practice inspired by independently reported topics.</p></div>}</article><footer className="quiz-actions"><span>Difficulty: {question.difficulty}</span><button className="button" onClick={next}>Next research question →</button></footer></section></div>;
}
