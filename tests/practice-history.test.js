import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PracticeHistory} from '../js/practice-history.js';

test('Previous and Next retain choices and feedback without branching',()=>{
  const h=new PracticeHistory();
  h.visit(81).status={selected:2,feedback:'correct'};
  assert.equal(h.canGoBack,false);
  assert.equal(h.next(),false);
  h.visit(100).status={selected:0,feedback:'incorrect'};
  h.previous();
  assert.equal(h.current.id,81);
  assert.equal(h.current.status.feedback,'correct');
  assert.equal(h.canGoForward,true);
  assert.equal(h.next(),true);
  assert.equal(h.current.id,100);
  assert.equal(h.current.status.feedback,'incorrect');
});
test('completion screen can return to the last question',()=>{
  const h=new PracticeHistory();h.visit(357);h.next();h.visit(null);
  assert.equal(h.canGoBack,true);h.previous();assert.equal(h.current.id,357);
  h.next();assert.equal(h.current.id,null);
});
test('fresh page histories start empty and session histories are independent',()=>{
  const a=new PracticeHistory(),b=new PracticeHistory();a.visit(10);a.next();a.visit(20);
  assert.equal(b.current,undefined);assert.equal(b.canGoBack,false);
  const reloaded=new PracticeHistory();assert.equal(reloaded.entries.length,0);
});
test('explicit question selection replaces only the forward path',()=>{
  const h=new PracticeHistory();h.visit(1);h.next();h.visit(2);h.previous();h.select(3);
  assert.deepEqual(h.entries.map(e=>e.id),[1,3]);h.previous();assert.equal(h.current.id,1);
});
