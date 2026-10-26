export const STORAGE_KEY = 'territory.practice.v1';
export const BANK_SIZE = 357;
export const TEST_DURATION = 2 * 60 * 60 * 1000;
export const uid = () => globalThis.crypto.randomUUID();
export function freshState() {
  const id = uid();
  return {version:2, activeSession:id, sessions:[{id,name:'My driving journey',createdAt:Date.now(),completed:Object.fromEntries(Array.from({length:80},(_,i)=>[i+1,{method:'imported',at:null}])),current:null,stars:[5,16,23,38,44,54,67]}], tests:[], activeTest:null};
}
export function shuffled(items, random=Math.random) {
  const a = [...items];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
export const remaining = (questions,session) => questions.filter(q=>!session.completed[q.id]);
export function nextQuestion(questions,session){
  const pool=remaining(questions,session);
  const q=pool.find(q=>q.id===session.current) || shuffled(pool)[0];
  session.current=q?.id??null;
  return q;
}
export function complete(session,id,method){session.completed[id]={method,at:Date.now()};session.current=null;}
export function newTest(questions){return {id:uid(),startedAt:Date.now(),deadline:Date.now()+TEST_DURATION,ids:shuffled(questions.map(q=>q.id)).slice(0,30),answers:{},index:0};}
export function grade(test,questions,reason='submitted'){
  return {...test,finishedAt:Date.now(),reason,score:test.ids.filter(id=>questions.find(q=>q.id===id).answer===test.answers[id]).length};
}
export function validState(s){
  const validId=id=>Number.isInteger(Number(id))&&Number(id)>=1&&Number(id)<=BANK_SIZE;
  const validStars=stars=>Array.isArray(stars)&&stars.every(id=>Number.isInteger(id)&&validId(id))&&new Set(stars).size===stars.length;
  const answerMap=a=>a&&typeof a==='object'&&!Array.isArray(a)&&Object.entries(a).every(([id,v])=>validId(id)&&Number.isInteger(v)&&v>=0&&v<3);
  const test=t=>t&&typeof t.id==='string'&&Number.isFinite(t.startedAt)&&Number.isFinite(t.deadline)&&Array.isArray(t.ids)&&t.ids.length===30&&new Set(t.ids).size===30&&t.ids.every(id=>Number.isInteger(id)&&validId(id))&&answerMap(t.answers)&&Object.keys(t.answers).every(id=>t.ids.includes(Number(id)))&&Number.isInteger(t.index)&&t.index>=0&&t.index<30;
  return !!(s&&[1,2].includes(s.version)&&Array.isArray(s.sessions)&&s.sessions.length&&new Set(s.sessions.map(x=>x.id)).size===s.sessions.length&&s.sessions.every(x=>x&&(s.version===1||validStars(x.stars))&&typeof x.id==='string'&&typeof x.name==='string'&&x.name.length>0&&x.name.length<=80&&x.completed&&typeof x.completed==='object'&&!Array.isArray(x.completed)&&Object.entries(x.completed).every(([id,v])=>validId(id)&&v&&['correct','revealed','imported'].includes(v.method))&&(x.current===null||validId(x.current)))&&s.sessions.some(x=>x.id===s.activeSession)&&(s.version===2||validStars(s.stars))&&Array.isArray(s.tests)&&s.tests.every(t=>test(t)&&Number.isFinite(t.finishedAt)&&Number.isInteger(t.score)&&t.score>=0&&t.score<=30)&&(s.activeTest===null||test(s.activeTest)));
}

// Old stars were global and carry no session attribution. Preserve them once,
// in the original (first-created) session, rather than duplicating them.
export function migrateState(data){
  if(!validState(data))throw Error('Invalid saved progress');
  if(data.version===2)return data;
  const {stars,...rest}=data;
  return {...rest,version:2,sessions:data.sessions.map((s,index)=>({...s,stars:index===0?[...stars]:[]}))};
}
