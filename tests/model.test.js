import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questions} from '../data/questions.js';
import {freshState,nextQuestion,complete,newTest,grade,validState,shuffled,TEST_DURATION} from '../js/model.js';
import {existsSync} from 'node:fs';

test('PDF bank is contiguous, complete, and every asset resolves',()=>{
 assert.equal(questions.length,357);
 questions.forEach((q,i)=>{assert.equal(q.id,i+1);assert.equal(q.options.length,3);assert.ok(q.answer>=0&&q.answer<3);assert.ok(q.question.length>8);assert.ok(q.page>=1&&q.page<=121);q.images.forEach(src=>assert.ok(existsSync(src),src));});
 assert.equal(questions.filter(q=>q.images.length).length,189);
});
test('first visit seeds exactly the requested completion and stars',()=>{const s=freshState();assert.equal(Object.keys(s.sessions[0].completed).length,80);for(let i=1;i<=80;i++)assert.equal(s.sessions[0].completed[i].method,'imported');assert.deepEqual(s.stars,[5,16,23,38,44,54,67]);assert.ok(validState(s));});
test('session visits every remaining question once, then finishes',()=>{const s=freshState().sessions[0],seen=new Set();for(let i=0;i<277;i++){const q=nextQuestion(questions,s);assert.ok(q.id>80);assert.ok(!seen.has(q.id));seen.add(q.id);complete(s,q.id,'correct');}assert.equal(seen.size,277);assert.equal(nextQuestion(questions,s),undefined);});
test('unfinished question survives reload and revealed questions are completed',()=>{const s=freshState().sessions[0],q=nextQuestion(questions,s);const restored=JSON.parse(JSON.stringify(s));assert.equal(nextQuestion(questions,restored).id,q.id);complete(restored,q.id,'revealed');assert.notEqual(nextQuestion(questions,restored)?.id,q.id);});
test('session completion is isolated and reset allows all questions',()=>{const a=freshState().sessions[0],b={completed:{},current:null};complete(b,100,'correct');assert.equal(a.completed[100],undefined);b.completed={};const seen=new Set();for(let i=0;i<357;i++){const q=nextQuestion(questions,b);assert.ok(!seen.has(q.id));seen.add(q.id);complete(b,q.id,'correct');}assert.equal(seen.size,357);});
test('mock test has 30 unique questions and a fixed two-hour deadline',()=>{const t=newTest(questions);assert.equal(t.ids.length,30);assert.equal(new Set(t.ids).size,30);assert.ok(Math.abs(t.deadline-t.startedAt-TEST_DURATION)<10);const copy=JSON.parse(JSON.stringify(t));assert.equal(copy.deadline,t.deadline);});
test('grading counts correct answers only; unanswered and wrong are incorrect',()=>{const t=newTest(questions);t.ids.slice(0,10).forEach(id=>t.answers[id]=questions[id-1].answer);t.ids.slice(10,20).forEach(id=>t.answers[id]=(questions[id-1].answer+1)%3);assert.equal(grade(t,questions).score,10);assert.equal(grade(t,questions,'timeout').reason,'timeout');});
test('backup round trip preserves completed sessions, stars, and history',()=>{const s=freshState();const t=newTest(questions);s.activeTest=t;assert.ok(validState(s));s.tests.push(grade(t,questions));s.activeTest=null;const copy=JSON.parse(JSON.stringify(s));assert.ok(validState(copy));assert.deepEqual(copy,s);});
test('malformed backups fail validation',()=>{assert.equal(validState(null),false);assert.equal(validState({}),false);const s=freshState();s.stars=[999];assert.equal(validState(s),false);const t=freshState();t.activeTest=newTest(questions);t.activeTest.ids[1]=t.activeTest.ids[0];assert.equal(validState(t),false);const u=freshState();u.sessions[0].completed[358]={method:'correct'};assert.equal(validState(u),false);});
test('shuffle preserves input and membership',()=>{const a=[1,2,3,4];assert.deepEqual(shuffled(a,()=>0).sort(),a);assert.deepEqual(a,[1,2,3,4]);});
