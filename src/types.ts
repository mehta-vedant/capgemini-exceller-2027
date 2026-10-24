export type ModuleId = 'ai' | 'technical' | 'communication' | 'reasoning';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Provenance = 'OFFICIAL' | 'CANDIDATE_REPORTED' | 'RECONSTRUCTED' | 'PREDICTED' | 'GENERAL_PRACTICE';
export interface Question { id:string; module:ModuleId; topic:string; subtopic:string; difficulty:Difficulty; kind:'mcq'|'scenario'; statement:string; options:string[]; correctAnswer:number; explanation:string; distractorExplanations:string[]; concept:string; sourceIds:string[]; provenance:Provenance; estimatedSeconds:number; tags:string[]; verified:boolean; }
export interface CodingChallenge { id:string; title:string; category:string; language:'cpp'|'c'|'java'; difficulty:Difficulty; statement:string; starterCode:string; referenceSolution:string; publicTests:{input:string; expected:string}[]; hiddenTests:{input:string; expected:string}[]; bugMetadata:string[]; }
export interface Attempt { id:string; questionId:string; selectedAnswer:number; correct:boolean; durationSeconds:number; mode:'learning'|'assessment'; createdAt:string; }
export interface MockSession { id:string; preset:string; questionIds:string[]; answers:Record<string,number>; marked:string[]; startedAt:string; durationSeconds:number; submittedAt?:string; }
