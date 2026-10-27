import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,deleteSession,validState,STORAGE_KEY} from '../js/model.js';

test('deleting inactive session retains active progress and test data',()=>{
 const state=freshState();state.sessions.push({id:'other',name:'Other',createdAt:1,completed:{},stars:[99],current:null});
 const before=structuredClone(state),result=deleteSession(state,'other');
 assert.deepEqual(state,before);assert.equal(result.activeSession,state.activeSession);
 assert.deepEqual(result.sessions,[state.sessions[0]]);assert.equal(result.tests,state.tests);assert.equal(result.activeTest,state.activeTest);assert.ok(validState(result));
});
test('deleting active session switches to remaining session',()=>{
 const state=freshState();state.sessions.push({id:'other',name:'Other',createdAt:1,completed:{},stars:[99],current:null});
 const result=deleteSession(state,state.activeSession);assert.equal(result.activeSession,'other');assert.deepEqual(result.sessions[0].stars,[99]);assert.ok(validState(result));
});
test('last session deletion creates an empty replacement without seeding old progress',()=>{
 const state=freshState(),result=deleteSession(state,state.activeSession);
 assert.equal(result.sessions.length,1);assert.notEqual(result.activeSession,state.activeSession);
 assert.deepEqual(result.sessions[0].completed,{});assert.deepEqual(result.sessions[0].stars,[]);assert.ok(validState(result));
 assert.equal(deleteSession(state,'missing'),state);
});
test('UI requires confirmation; cancel keeps data and successful deletion persists',async()=>{
 const data=new Map([[STORAGE_KEY,JSON.stringify(freshState())]]),listeners={},elements=new Map();
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 for(const id of ['#main','#session-select','#star-count','#modal','#modal-content','#delete-session-message','#toast'])elements.set(id,{innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){},toggle(){}},focus(){},close(){this.open=false;},showModal(){this.open=true;}});
 globalThis.document={querySelector:id=>elements.get(id)??null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn};
 globalThis.window={addEventListener(){},scrollTo(){}};globalThis.location={hash:'#sessions'};
 const interval=globalThis.setInterval,timeout=globalThis.setTimeout;globalThis.setInterval=()=>0;globalThis.setTimeout=()=>0;
 try{
  await import('../js/app.js?delete-test');
  const before=data.get(STORAGE_KEY),id=JSON.parse(before).activeSession;
  const click=action=>listeners.click({target:{closest:()=>({dataset:{action,id}})}});
  await click('delete-session');assert.equal(data.get(STORAGE_KEY),before);assert.equal(elements.get('#modal').open,true);
  assert.match(elements.get('#modal-content').innerHTML,/last session/);
  await click('close');assert.equal(data.get(STORAGE_KEY),before);
  await click('delete-session');await click('confirm-delete-session');
  const saved=JSON.parse(data.get(STORAGE_KEY));assert.notEqual(saved.activeSession,id);assert.deepEqual(saved.sessions[0].completed,{});
  assert.equal(elements.get('#modal').open,false);assert.ok(validState(saved));
 }finally{globalThis.setInterval=interval;globalThis.setTimeout=timeout;}
});
