import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '128kb' }));
const port = Number(process.env.PORT ?? 8787);
const model = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

app.get('/api/health', (_req, res) => res.json({ ok: true, gemini: Boolean(gemini), docker: process.env.DOCKER_ENABLED === 'true' }));
app.post('/api/ai/chat', async (req, res) => {
  if (!gemini) return res.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to .env and restart the local API.' });
  const { message, history = [], remainingTokens = 2000 } = req.body as { message?: string; history?: { role: 'user' | 'model'; text: string }[]; remainingTokens?: number };
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'A message is required.' });
  if (!Number.isInteger(remainingTokens) || remainingTokens < 64 || remainingTokens > 2000) return res.status(400).json({ error: 'Invalid challenge token budget.' });
  try {
    const contents = [...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user' as const, parts: [{ text: message }] }];
    const counted = await gemini.models.countTokens({ model, contents });
    const inputTokens = counted.totalTokens ?? 0;
    const maxOutputTokens = remainingTokens - inputTokens;
    if (maxOutputTokens < 64) return res.status(429).json({ error: 'This prompt leaves fewer than 64 tokens for a useful response.', inputTokens });
    const response = await gemini.models.generateContent({ model, contents, config: { maxOutputTokens, systemInstruction: 'You are a study partner for an assessment practice platform. Guide reasoning, ask the candidate to validate code, and never claim their answer is correct without evidence.' } });
    const usage = response.usageMetadata;
    res.json({ text: response.text ?? '', usage: { inputTokens: usage?.promptTokenCount ?? inputTokens, outputTokens: usage?.candidatesTokenCount ?? 0, totalTokens: usage?.totalTokenCount ?? inputTokens } });
  } catch (error) { res.status(502).json({ error: error instanceof Error ? error.message : 'Gemini request failed.' }); }
});

app.post('/api/runner/status', (_req, res) => {
  if (process.env.DOCKER_ENABLED !== 'true') return res.json({ available: false, reason: 'DOCKER_ENABLED is not true.' });
  const child = spawn('docker', ['info'], { windowsHide: true }); let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.on('error', () => res.json({ available: false, reason: 'Docker executable is unavailable.' }));
  child.on('close', (code) => res.json({ available: code === 0, reason: code === 0 ? undefined : output || 'Docker is not running.' }));
});
app.post('/api/runner/run', async (req, res) => {
  if (process.env.DOCKER_ENABLED !== 'true') return res.status(503).json({ error: 'Code execution is unavailable until Docker is enabled.' });
  const { language, code, input = '' } = req.body as { language?: string; code?: string; input?: string };
  if (!code || !['cpp', 'c', 'java'].includes(language ?? '')) return res.status(400).json({ error: 'Supported languages are cpp, c, and java.' });
  const specs: Record<string, { image: string; source: string; command: string }> = {
    cpp: { image: 'gcc:14', source: 'main.cpp', command: 'g++ -std=c++17 -O2 /workspace/main.cpp -o /tmp/app && chmod 755 /tmp/app && timeout 3 /tmp/app < /workspace/input.txt' },
    c: { image: 'gcc:14', source: 'main.c', command: 'gcc -std=c17 -O2 /workspace/main.c -o /tmp/app && chmod 755 /tmp/app && timeout 3 /tmp/app < /workspace/input.txt' },
    java: { image: 'eclipse-temurin:21-jdk', source: 'Main.java', command: 'javac -d /tmp /workspace/Main.java && timeout 3 java -cp /tmp Main < /workspace/input.txt' }
  };
  const spec = specs[language!]; const runDir = await mkdtemp(join(tmpdir(), 'exceller-run-'));
  try {
    await Promise.all([writeFile(join(runDir, spec.source), code), writeFile(join(runDir, 'input.txt'), input)]);
    const args = ['run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp:rw,exec,nosuid,size=32m', '--pids-limit', '64', '--memory', '256m', '--cpus', '0.5', '--security-opt', 'no-new-privileges', '--user', '65534:65534', '--mount', `type=bind,src=${runDir},dst=/workspace,readonly`, spec.image, 'sh', '-lc', spec.command];
    const child = spawn('docker', args, { windowsHide: true }); let stdout = '', stderr = ''; let replied = false;
    const reply = (status: number, body: object) => { if (!replied) { replied = true; res.status(status).json(body); } };
    child.stdout.on('data', (data) => { stdout += data; }); child.stderr.on('data', (data) => { stderr += data; });
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => child.kill('SIGKILL'), 15000);
      child.on('error', () => { clearTimeout(timer); reply(503, { error: 'Docker runner is unavailable.' }); resolve(); });
      child.on('close', (exitCode) => { clearTimeout(timer); reply(200, { exitCode, stdout: stdout.slice(0, 10000), stderr: stderr.slice(0, 10000) }); resolve(); });
    });
  } finally { await rm(runDir, { recursive: true, force: true }); }
});
app.listen(port, () => console.log(`Exceller API listening on http://localhost:${port}`));
