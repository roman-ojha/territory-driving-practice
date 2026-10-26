import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,STORAGE_KEY} from '../js/model.js';
import {questions} from '../data/questions.js';

test('practice controller navigates backwards, restores feedback, and forgets history on reload',async()=>{
 const data=new Map([[STORAGE_KEY,JSON.stringify(freshState())]]);
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const listeners={};
 const elements=new Map();
 for(const id of ['#main','#session-select','#star-count','#modal','#toast'])elements.set(id,{innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){},toggle(){}},focus(){},close(){},showModal(){}});
 globalThis.document={querySelector:id=>elements.get(id)??null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn};
 globalThis.window={addEventListener(){},scrollTo(){}};
 globalThis.location={hash:'#practice'};
 const originalInterval=globalThis.setInterval;
 globalThis.setInterval=()=>0;
 try{
  await import('../js/app.js?navigation-test');
  const html=()=>elements.get('#main').innerHTML;
  const questionId=()=>Number(html().match(/QUESTION (\d+)/)[1]);
  const click=(action,extra={})=>listeners.click({target:{closest:()=>({dataset:{action,...extra}})}});
  const first=questionId();
  assert.match(html(),/data-action="previous" disabled/);
  click('answer',{option:String(questions[first-1].answer)});
  assert.match(html(),/Correct! Another step closer/);
  click('next');const second=questionId();assert.notEqual(first,second);
  click('previous');assert.equal(questionId(),first);assert.match(html(),/Correct! Another step closer/);
  click('star',{id:String(first)});assert.equal(questionId(),first);
  click('next');assert.equal(questionId(),second);
  const stored=JSON.parse(data.get(STORAGE_KEY));
  assert.equal(Object.keys(stored.sessions[0].completed).length,81);
  assert.equal(stored.histories,undefined);
  await import('../js/app.js?navigation-reload');
  assert.equal(questionId(),second);assert.match(html(),/data-action="previous" disabled/);
 }finally{globalThis.setInterval=originalInterval;}
});
