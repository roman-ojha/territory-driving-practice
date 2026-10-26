import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,migrateState,validState,STORAGE_KEY} from '../js/model.js';
import {dashboard} from '../js/dashboard.js';
import {questions} from '../data/questions.js';

function legacyState(){
 const s=freshState();s.version=1;s.stars=[5,16,84,327];
 delete s.sessions[0].stars;
 s.sessions.push({id:'second',name:'New session',createdAt:Date.now(),completed:{},current:null});
 s.activeSession='second';return s;
}
test('old shared stars migrate only to original session, regardless of active session',()=>{
 const old=legacyState(),s=migrateState(old);
 assert.equal(s.version,2);assert.ok(validState(s));assert.equal(s.activeSession,'second');
 assert.deepEqual(s.sessions[0].stars,old.stars);assert.deepEqual(s.sessions[1].stars,[]);
 assert.deepEqual(s.sessions[0].completed,old.sessions[0].completed);
 assert.equal(s.stars,undefined);assert.equal(old.version,1);
 s.sessions[1].stars.push(99);assert.ok(!s.sessions[0].stars.includes(99));
 assert.deepEqual(migrateState(s),s);
});
test('dashboard and starred filter use only the displayed session',()=>{
 const s=migrateState(legacyState());
 const original=dashboard(s,questions,s.sessions[0],'starred');
 const other=dashboard(s,questions,s.sessions[1],'starred');
 assert.equal((original.match(/data-action="inspect"/g)||[]).length,4);
 assert.equal((other.match(/data-action="inspect"/g)||[]).length,0);
});
test('legacy storage and backups migrate; new backups retain independent stars',async()=>{
 const legacy=legacyState();
 const data=new Map([[STORAGE_KEY,JSON.stringify(legacy)]]);
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const storage=await import('../js/storage.js');
 const s=storage.load();assert.deepEqual(s.sessions[1].stars,[]);
 assert.deepEqual(storage.importBackup(JSON.stringify(legacy)),s);
 s.sessions[1].stars=[99];storage.save(s);
 assert.deepEqual(storage.load(),s);
 assert.deepEqual(storage.importBackup(JSON.stringify(s)),s);
 const invalid=structuredClone(s);invalid.sessions[1].stars=[999];
 assert.throws(()=>storage.importBackup(JSON.stringify(invalid)));
 assert.deepEqual(storage.load(),s);
});
test('switching sessions on starred review clears the old queue and toggles only active stars',async()=>{
 const s=migrateState(legacyState());s.activeSession=s.sessions[0].id;
 const data=new Map([[STORAGE_KEY,JSON.stringify(s)]]),listeners={},elements=new Map();
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 for(const id of ['#main','#session-select','#star-count','#modal','#toast'])elements.set(id,{innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){},toggle(){}},focus(){},close(){}});
 globalThis.document={querySelector:id=>elements.get(id)??null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn};
 globalThis.window={addEventListener(){},scrollTo(){}};globalThis.location={hash:'#starred'};
 const originalInterval=globalThis.setInterval;globalThis.setInterval=()=>0;
 try{
  await import('../js/app.js?session-stars');
  assert.match(elements.get('#main').innerHTML,/QUESTION/);
  await listeners.change({target:{id:'session-select',value:'second'}});
  assert.match(elements.get('#main').innerHTML,/No starred questions yet/);
  assert.equal(elements.get('#star-count').textContent,0);
  listeners.click({target:{closest:()=>({dataset:{action:'star',id:'99'}})}});
  assert.deepEqual(JSON.parse(data.get(STORAGE_KEY)).sessions[1].stars,[99]);
  await listeners.change({target:{id:'session-select',value:s.sessions[0].id}});
  assert.equal(elements.get('#star-count').textContent,4);
  assert.ok(!JSON.parse(data.get(STORAGE_KEY)).sessions[0].stars.includes(99));
 }finally{globalThis.setInterval=originalInterval;}
});
