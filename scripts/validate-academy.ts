import { academyUnits } from '../src/data/academy.ts';
import { academyDepth } from '../src/data/academy-depth.ts';
import { questions } from '../src/data/questions.ts';

const requiredTopics = ['AI capabilities and limits','ML families','classification vs regression','datasets and splits','confusion matrix','accuracy/precision/recall/F1','bias/variance','neural networks','foundation models','tokens','embeddings','attention','transformer families','prompt engineering','fine-tuning','RAG pipeline','vector databases','prompt injection','agents','monitoring','relational model','keys','1NF/2NF/3NF/BCNF','joins','NULL','window functions','indexing','EXPLAIN','ACID','isolation','deadlocks','migrations','arrays','hash maps','binary search','sliding window','prefix sums','recursion','dynamic programming','graphs','BFS','DFS','polymorphism','processes/threads','TCP/IP','HTTP','Git','CI/CD','testing','debugging','AI coding','reasoning','behavioral'];
const errors: string[] = [];
if (academyUnits.length !== 30) errors.push(`Expected 30 units; found ${academyUnits.length}.`);
for (let day = 1; day <= 30; day++) if (!academyUnits.some((unit) => unit.day === day)) errors.push(`Missing day ${day}.`);
for (let day = 1; day <= 30; day++) {
  const deep = academyDepth[day];
  if (!deep) errors.push(`Missing deep lesson design for day ${day}.`);
  else if (deep.walkthrough.length < 4 || deep.recall.length < 3 || deep.protocol.length < 4 || deep.decision.choices.length !== 4) errors.push(`Day ${day}: incomplete deep learning loop.`);
}
for (const unit of academyUnits) {
  if (unit.blocks.length < 3 || unit.blocks.length > 5) errors.push(`${unit.id}: needs 3–5 teaching blocks.`);
  if (unit.outcomes.length < 3 || unit.checks.length < 2 || unit.revision.length < 3) errors.push(`${unit.id}: incomplete learning structure.`);
  if (!unit.visual.items.length || !unit.assignment || !unit.trap) errors.push(`${unit.id}: missing visual, assignment, trap, or required reference.`);
  const practice = questions.filter((question) => question.module === unit.practice.module && (!unit.practice.scenarioOnly || question.kind === 'scenario'));
  if (unit.priority === 'P0' && practice.length < 5) errors.push(`${unit.id}: fewer than five linked scenario questions.`);
}
const mapped = new Set(academyUnits.flatMap((unit) => unit.topics));
for (const topic of requiredTopics) if (!mapped.has(topic)) errors.push(`Required topic not mapped: ${topic}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(JSON.stringify({ units: academyUnits.length, blocks: academyUnits.reduce((sum, unit) => sum + unit.blocks.length, 0), mappedTopics: mapped.size }, null, 2));

