import { questions } from '../src/data/questions.ts';
import { aiCodingChallenges, debuggingChallenges } from '../src/data/challenges.ts';
import { questionSchema } from '../src/data/schemas.ts';
const ids=new Set<string>(), statements=new Set<string>(), challengeIds=new Set<string>(); let errors:string[]=[];
for(const q of questions){const parsed=questionSchema.safeParse(q);if(!parsed.success)errors.push(`${q.id}: ${parsed.error.message}`);if(ids.has(q.id))errors.push(`Duplicate id: ${q.id}`);ids.add(q.id);if(statements.has(q.statement))errors.push(`Duplicate statement: ${q.statement}`);statements.add(q.statement);}
for(const c of [...debuggingChallenges,...aiCodingChallenges]){if(challengeIds.has(c.id))errors.push(`Duplicate challenge id: ${c.id}`);challengeIds.add(c.id);if(!c.publicTests.length||!c.hiddenTests.length||!c.referenceSolution)errors.push(`${c.id}: missing tests or reference solution`);if(!['cpp','c','java'].includes(c.language))errors.push(`${c.id}: unsupported language`);for(const test of [...c.publicTests,...c.hiddenTests])if(!test.input.trim()||!test.expected.trim())errors.push(`${c.id}: invalid test case`);}
const counts=Object.fromEntries(['ai','technical','communication','reasoning'].map(m=>[m,questions.filter(q=>q.module===m).length]));
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log(JSON.stringify({questions:questions.length,debugging:debuggingChallenges.length,aiCoding:aiCodingChallenges.length,counts},null,2));
