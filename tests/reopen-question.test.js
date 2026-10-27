import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,STORAGE_KEY} from '../js/model.js';
import {questions} from '../data/questions.js';
import {PracticeHistory} from '../js/practice-history.js';

test('reopening clears stale answer feedback and the completion screen',()=>{
 const h=new PracticeHistory();h.visit(5).status={reveal:true};h.next();h.visit(6).status={feedback:'correct'};h.next();h.visit(null);
 h.reopen(5);assert.deepEqual(h.entries[0].status,{});assert.equal(h.entries[1].status.feedback,'correct');assert.equal(h.current,undefined);
});
test('clicking completed map boxes reopens only active-session questions and persists',async()=>{
 const state=freshState();for(let i=1;i<=357;i++)state.sessions[0].completed[i]={method:'correct',at:1};
 state.sessions.push({...structuredClone(state.sessions[0]),id:'other',name:'Other'});
 const data=new Map([[STORAGE_KEY,JSON.stringify(state)]]),listeners={},elements=new Map();
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 for(const id of ['#main','#session-select','#star-count','#modal','#modal-content','#toast'])elements.set(id,{innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){},toggle(){}},focus(){},close(){this.open=false;},showModal(){this.open=true;}});
 globalThis.document={querySelector:id=>elements.get(id)??null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn};
 globalThis.window={addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){}};globalThis.location={hash:'#practice'};
 const interval=globalThis.setInterval,timeout=globalThis.setTimeout;globalThis.setInterval=()=>0;globalThis.setTimeout=()=>0;
 try{
  await import('../js/app.js?reopen-test');assert.match(elements.get('#main').innerHTML,/Congratulations/);
  location.hash='#dashboard';listeners.hashchange();
  const click=(action,extra={})=>listeners.click({target:{closest:()=>({dataset:{action,...extra}})}});
  await click('inspect',{id:'5'});
  const saved=JSON.parse(data.get(STORAGE_KEY));assert.equal(saved.sessions[0].completed[5],undefined);assert.ok(saved.sessions[1].completed[5]);assert.ok(saved.sessions[0].stars.includes(5));
  assert.match(elements.get('#main').innerHTML,/356 completed · 1 to go/);assert.equal(elements.get('#modal').open,false);
  location.hash='#practice';listeners.hashchange();assert.match(elements.get('#main').innerHTML,/QUESTION 005/);assert.doesNotMatch(elements.get('#main').innerHTML,/option correct/);
  await click('answer',{option:String(questions[4].answer)});assert.ok(JSON.parse(data.get(STORAGE_KEY)).sessions[0].completed[5]);
  location.hash='#dashboard';listeners.hashchange();await click('inspect',{id:'5'});
  await import('../js/app.js?reopen-reload');assert.equal(JSON.parse(data.get(STORAGE_KEY)).sessions[0].completed[5],undefined);
  await click('inspect',{id:'5'});assert.equal(elements.get('#modal').open,true);
 }finally{globalThis.setInterval=interval;globalThis.setTimeout=timeout;}
});
