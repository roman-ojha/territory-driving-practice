import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,validState} from '../js/model.js';
import {encodeSession,decodeSession,shareLink,importSharedSession,PUBLIC_SITE} from '../js/share.js';
import {sharedPreview,sharingDialog} from '../js/share-view.js';
import qrcode from '../js/vendor/qrcode.js';

test('sharing round-trips all completion methods and stars including question 357',()=>{
 const s=freshState().sessions[0];s.name='Revision 🚗 — दोस्रो';
 s.completed[81]={method:'correct',at:123};s.completed[357]={method:'revealed',at:456};s.stars.push(357);
 const copy=decodeSession(encodeSession(s));assert.equal(copy.name,s.name);assert.deepEqual(copy.stars,s.stars);
 assert.deepEqual(Object.keys(copy.completed),Object.keys(s.completed));
 for(const id of Object.keys(s.completed)){assert.equal(copy.completed[id].method,s.completed[id].method);assert.equal(copy.completed[id].at,null);}
});
test('full question bank fits a link and a QR code even with a long Unicode name',()=>{
 const s=freshState().sessions[0];s.name='🚗'.repeat(40);
 for(let i=1;i<=357;i++)s.completed[i]={method:'correct',at:Date.now()};s.stars=Array.from({length:357},(_,i)=>i+1);
 const link=shareLink(s,PUBLIC_SITE);assert.ok(link.length<1600);
 const qr=qrcode(0,'M');qr.addData(link);qr.make();assert.ok(qr.getModuleCount()>20);
 assert.equal(Object.keys(decodeSession(link.split('#share=')[1]).completed).length,357);
 assert.match(sharingDialog(s,PUBLIC_SITE),/<svg/);
});
test('localhost links use the public site and hosted links retain repository paths',()=>{
 const s=freshState().sessions[0];
 assert.ok(shareLink(s,'http://127.0.0.1:4173/#sessions').startsWith(PUBLIC_SITE+'#share='));
 assert.ok(shareLink(s,'https://example.com/repo/?x=1#sessions').startsWith('https://example.com/repo/#share='));
});
test('import appends a separate copy without mutating existing sessions or test history',()=>{
 const state=freshState(),before=structuredClone(state),snapshot=decodeSession(encodeSession(state.sessions[0]));
 const imported=importSharedSession(state,snapshot);
 assert.deepEqual(state,before);assert.equal(imported.sessions.length,2);assert.ok(validState(imported));
 assert.notEqual(imported.activeSession,state.activeSession);assert.match(imported.sessions[1].name,/shared copy/);
 imported.sessions[1].stars.push(100);assert.ok(!state.sessions[0].stars.includes(100));
 assert.deepEqual(imported.tests,state.tests);
});
test('invalid, oversized, truncated and unsupported payloads are rejected',()=>{
 for(const token of ['', '!', 'a'.repeat(2000), 'e30',encodeSession(freshState().sessions[0]).slice(0,-3)])assert.throws(()=>decodeSession(token));
 const bad=Buffer.from(JSON.stringify({v:2,bank:'nt-2021-357',name:'Test',data:'AA'})).toString('base64url');assert.throws(()=>decodeSession(bad));
 assert.match(sharedPreview('!'),/invalid, incomplete/);
 assert.doesNotMatch(sharedPreview('!'),/data-action="import-shared"/);
});
test('incoming session names are escaped and require explicit import',()=>{
 const s=freshState().sessions[0];s.name='<img src=x onerror=alert(1)>';
 const html=sharedPreview(encodeSession(s));assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);assert.match(html,/Import as a new session/);
});
