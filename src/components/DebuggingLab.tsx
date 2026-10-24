import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { debuggingChallenges } from '../data/challenges';
import './debugging-lab.css';

export function DebuggingLab() {
  const [challenge, setChallenge] = useState(debuggingChallenges[0]);
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Checking local runner…');
  const [running, setRunning] = useState(false);
  const [publicAttempted, setPublicAttempted] = useState(false);

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/runner/status', { method: 'POST' });
      const body = await response.json();
      setStatus(body.available ? 'Docker runner ready' : body.reason);
    } catch { setStatus('Local API is not running.'); }
  };
  useEffect(() => { void refreshStatus(); }, []);
  const runHidden = async () => {
    setRunning(true); setOutput('Submitting for hidden validation…');
    try {
      const results = await Promise.all(challenge.hiddenTests.map(async (test, index) => {
        const response = await fetch('/api/runner/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: challenge.language, code, input: test.input }) });
        const result = await response.json(); const passed = response.ok && result.exitCode === 0 && String(result.stdout ?? '').trim() === test.expected.trim();
        return `Hidden test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}${result.stderr ? `\nCompiler/runtime:\n${result.stderr}` : ''}`;
      }));
      setOutput(results.join('\n\n'));
    } catch { setOutput('The local API is unavailable. Start it with npm run dev.'); }
    finally { setRunning(false); void refreshStatus(); }
  };
  const select = (id: string) => { const next = debuggingChallenges.find((item) => item.id === id)!; setChallenge(next); setCode(next.starterCode); setOutput(''); setPublicAttempted(false); };
  const run = async () => {
    setRunning(true); setOutput('Running all public tests in the restricted Docker container…');
    try {
      const results = await Promise.all(challenge.publicTests.map(async (test, index) => {
        const response = await fetch('/api/runner/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: challenge.language, code, input: test.input }) });
        const result = await response.json(); const actual = String(result.stdout ?? '').trim(); const expected = test.expected.trim();
        const passed = response.ok && result.exitCode === 0 && actual === expected;
        return `Public test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}\nExpected: ${expected}\nActual: ${actual || '(no output)'}${result.stderr ? `\nCompiler/runtime:\n${result.stderr}` : ''}`;
      }));
      setOutput(results.join('\n\n'));
    } catch { setOutput('The local API is unavailable. Start it with npm run dev.'); }
    finally { setRunning(false); void refreshStatus(); }
  };

  return <div className="page"><section className="page-title"><p className="eyebrow">DEBUGGING LAB · REVIEW → IDENTIFY → FIX → VALIDATE</p><h1>Fix real bugs.</h1><p>Code runs only through the configured local Docker sandbox. Status: <b>{status}</b></p></section><div className="workspace"><aside><label>Challenge<select value={challenge.id} onChange={(event) => select(event.target.value)}>{debuggingChallenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><h2>{challenge.title}</h2><p>{challenge.statement}</p><h3>Public tests ({challenge.publicTests.length})</h3>{challenge.publicTests.map((test, index) => <pre key={index}>Input:{'\n'}{test.input}Expected:{'\n'}{test.expected}</pre>)}<p className="hidden-test-note">{challenge.hiddenTests.length} hidden validation case{challenge.hiddenTests.length === 1 ? '' : 's'} are available after the public attempt.</p></aside><section><div className="code-editor"><Editor height="440px" language="cpp" path={`${challenge.id}.cpp`} theme="vs-dark" value={code} onChange={(value) => setCode(value ?? '')} loading="Loading code editor…" options={{ fontSize: 14, fontFamily: 'Cascadia Code, Consolas, monospace', minimap: { enabled: false }, lineNumbers: 'on', wordWrap: 'on', automaticLayout: true, tabSize: 2, scrollBeyondLastLine: false, padding: { top: 14, bottom: 14 } }} /></div><div className="editor-actions"><button className="button" disabled={running} onClick={() => { setPublicAttempted(true); void run(); }}>{running ? 'Running…' : `Run ${challenge.publicTests.length} public test${challenge.publicTests.length === 1 ? '' : 's'}`}</button>{publicAttempted && <button className="button secondary" disabled={running} onClick={() => void runHidden()}>Submit for hidden validation</button>}<button className="text" disabled={!publicAttempted} onClick={() => setOutput(`Reference solution\n${challenge.referenceSolution}`)}>Reveal reference solution</button></div><pre className="terminal">{output || 'Compile and public-test output appears here.'}</pre></section></div></div>;
}
