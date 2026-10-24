import Dexie, { type Table } from 'dexie';
import type { Attempt, MockSession } from '../types';
export interface Preference { key:string; value:unknown; }
export interface Note { id:string; questionId?:string; text:string; createdAt:string; }
export interface LessonProgress { id:string; lessonId:string; completedAt:string; }
export interface RevisionItem { id:string; questionId:string; topic:string; dueAt:string; createdAt:string; }
export interface StudyBlockProgress { id:string; unitId:string; blockId:string; completedAt:string; }
export interface DailyProgress { id:string; unitId:string; completedAt:string; }
class PracticeDatabase extends Dexie { attempts!:Table<Attempt,string>; sessions!:Table<MockSession,string>; preferences!:Table<Preference,string>; notes!:Table<Note,string>; lessonProgress!:Table<LessonProgress,string>; revisions!:Table<RevisionItem,string>; studyBlocks!:Table<StudyBlockProgress,string>; dailyProgress!:Table<DailyProgress,string>; constructor(){super('exceller-practice');this.version(1).stores({attempts:'id,questionId,createdAt,mode',sessions:'id,preset,startedAt',preferences:'key',notes:'id,questionId,createdAt'});this.version(2).stores({attempts:'id,questionId,createdAt,mode',sessions:'id,preset,startedAt',preferences:'key',notes:'id,questionId,createdAt',lessonProgress:'id,lessonId,completedAt',revisions:'id,questionId,topic,dueAt'});this.version(3).stores({attempts:'id,questionId,createdAt,mode',sessions:'id,preset,startedAt',preferences:'key',notes:'id,questionId,createdAt',lessonProgress:'id,lessonId,completedAt',revisions:'id,questionId,topic,dueAt',studyBlocks:'id,unitId,blockId,completedAt',dailyProgress:'id,unitId,completedAt'});} }
export const db=new PracticeDatabase();
export const preference=async<T>(key:string,fallback:T):Promise<T>=>((await db.preferences.get(key))?.value as T|undefined)??fallback;
