import {PracticeHistory} from './practice-history.js';
import {questions} from '../data/questions.js';
import {uid,nextQuestion,complete,shuffled,newTest,grade} from './model.js';
import {load,save,storageIssue,exportBackup,importBackup} from './storage.js';
import {esc,heading,button,empty,toast,modal,closeModal} from './ui.js';
import {dashboard} from './dashboard.js';
import {practiceView,questionCard} from './question.js';
import {sessionsView} from './sessions.js';
import {testsView,activeTestView,resultView} from './tests.js';

let state=load(),status={},current=null,starQueue=null,starIndex=0,starSession=null,filter='all',resultId=null;
const histories=new Map();
function historyKey(){return route()==='starred'?'starred':`practice:${state.activeSession}`;}
function history(){const key=historyKey();if(!histories.has(key))histories.set(key,new PracticeHistory());return histories.get(key);}
function practiceScreen(){const h=history();return practiceView(current,state,session(),status,route(),{canGoBack:h.canGoBack,canGoForward:h.canGoForward});}
const main=document.querySelector('#main');
const session=()=>state.sessions.find(s=>s.id===state.activeSession);
const route=()=>location.hash.slice(1)||'dashboard';
function persist(){if(!save(state))toast(storageIssue);}
function go(page){if(route()===page)render();else location.hash=page;}
function finishTest(reason){if(!state.activeTest)return;const result=grade(state.activeTest,questions,reason);state.tests.push(result);state.activeTest=null;resultId=result.id;persist();closeModal();go('result');}
function checkDeadline(){if(state.activeTest&&Date.now()>=state.activeTest.deadline){finishTest('timeout');return true;}return false;}
function timer(){if(checkDeadline())return;const el=document.querySelector('#timer');if(el&&state.activeTest){const t=Math.max(0,Math.ceil((state.activeTest.deadline-Date.now())/1000));el.textContent=`◷ ${String(Math.floor(t/3600)).padStart(2,'0')}:${String(Math.floor(t/60)%60).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;el.classList.toggle('urgent',t<300);}}
function render(){
 if(checkDeadline())return;
 const page=route(),s=session();
 if(starSession!==s.id){histories.delete('starred');starQueue=null;starIndex=0;starSession=s.id;}
 document.querySelector('#session-select').innerHTML=state.sessions.map(x=>`<option value="${esc(x.id)}" ${x.id===s.id?'selected':''}>${esc(x.name)}</option>`).join('');
 document.querySelector('#star-count').textContent=session().stars.length;
 document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(['test','result'].includes(page)?'tests':page);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(page==='practice'){const entry=history().current||history().visit(nextQuestion(questions,s)?.id??null);current=questions.find(q=>q.id===entry.id);status=entry.status;persist();main.innerHTML=practiceScreen();}
 else if(page==='starred'){
   if(!starQueue)starQueue=shuffled(session().stars);
   const entry=history().current||history().visit(starQueue[starIndex]??null);current=questions.find(q=>q.id===entry.id);status=entry.status;
   main.innerHTML=session().stars.length||current?practiceScreen():heading('FOCUSED REVIEW','A place for the tricky ones.','')+empty('No starred questions yet.','Select the star on any practice question to save it here.',button('practice','Start practising'));
 }
 else if(page==='sessions')main.innerHTML=sessionsView(state);
 else if(page==='tests')main.innerHTML=testsView(state);
 else if(page==='test')main.innerHTML=state.activeTest?activeTestView(state.activeTest,questions):testsView(state);
 else if(page==='result'){const t=state.tests.find(t=>t.id===resultId)||state.tests.at(-1);main.innerHTML=t?resultView(t,questions,session().stars):testsView(state);}
 else main.innerHTML=dashboard(state,questions,s,filter);
 if(storageIssue)main.insertAdjacentHTML('afterbegin',`<div class="storage-warning" role="alert">${esc(storageIssue)}</div>`);
 timer();
}
function confirmDialog(title,text,action,extra=''){modal(`<h2>${title}</h2><p>${text}</p><div class="dialog-actions">${button('close','Cancel','secondary')}${button(action,'Confirm','primary',extra)}</div>`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action,id=b.dataset.id,number=Number(id);
 if(['test-answer','test-next','test-prev','test-jump','submit-test','confirm-submit'].includes(a)&&checkDeadline())return;
 if(['practice','tests','sessions'].includes(a)){status={};go(a);return;}
 if(a==='close'){closeModal();return;}
 if(a==='star'){session().stars=session().stars.includes(number)?session().stars.filter(x=>x!==number):[...session().stars,number];persist();if(document.querySelector('#modal').open){b.textContent=session().stars.includes(number)?'★ Starred':'☆ Star question';b.setAttribute('aria-pressed',session().stars.includes(number));document.querySelector('#star-count').textContent=session().stars.length;}else render();return;}
 if(a==='answer'&&current&&!status.reveal&&status.feedback!=='correct'){
   status.selected=Number(b.dataset.option);status.feedback=status.selected===current.answer?'correct':'incorrect';
   if(status.feedback==='correct'&&route()==='practice'){complete(session(),current.id,'correct');session().current=current.id;persist();}
   // Keep the answered card visible until the learner explicitly advances.
   main.innerHTML=practiceScreen();return;
 }
 if(a==='reveal'&&current){status.reveal=true;if(route()==='practice'){complete(session(),current.id,'revealed');persist();}main.innerHTML=practiceScreen();return;}
 if(a==='previous'){history().previous();render();return;}
 if(a==='next'){
   if(history().next()){render();return;}
   status={};if(route()==='starred')starIndex++;else{const prev=current?.id;session().current=null;const pool=questions.filter(q=>!session().completed[q.id]&&q.id!==prev);session().current=shuffled(pool)[0]?.id??null;persist();}render();return;
 }
 if(a==='restart-stars'){histories.delete('starred');starQueue=shuffled(session().stars);starIndex=0;status={};render();return;}
 if(a==='inspect'){const q=questions.find(q=>q.id===number),done=session().completed[number];modal(`<div class="panel-head"><h2>Question ${number}</h2>${button('close','Close ×','secondary')}</div>${questionCard(q,session().stars,{review:!!done,preview:true})}${done?'<p>This question is completed in your active session. Review it here without repeating it in practice.</p>':button('practice-specific','Practise this question →','primary',`data-id="${number}"`)}`);return;}
 if(a==='practice-specific'){const key=`practice:${state.activeSession}`;if(!histories.has(key))histories.set(key,new PracticeHistory());histories.get(key).select(number);session().current=number;status={};persist();closeModal();go('practice');return;}
 if(a==='create-session'||a==='rename-session'){const s=state.sessions.find(x=>x.id===id);modal(`<h2>${s?'Rename session':'A new road ahead.'}</h2><form id="session-form" data-id="${s?.id||''}"><label class="form-label">Session name<input name="name" maxlength="80" required value="${esc(s?.name||'')}" placeholder="e.g. The final stretch" autofocus></label><div class="dialog-actions">${button('close','Cancel','secondary')}<button type="submit" class="primary">${s?'Save name':'Create session'}</button></div></form>`);return;}
 if(a==='use-session'){state.activeSession=id;status={};persist();go('practice');return;}
 if(a==='reset-session'){confirmDialog('Start this session again?','This clears completion in this session only. Your stars, other sessions and test history stay saved.','confirm-reset',`data-id="${id}"`);return;}
 if(a==='confirm-reset'){const s=state.sessions.find(x=>x.id===id);s.completed={};s.current=null;histories.delete(`practice:${id}`);status={};persist();closeModal();render();toast('Session reset. A fresh start.');return;}
 if(a==='export'){exportBackup(state);return;}
 if(a==='start-test'){if(!state.activeTest){state.activeTest=newTest(questions);persist();}go('test');return;}
 if(a==='resume-test'){go('test');return;}
 if(a==='test-answer'&&state.activeTest){state.activeTest.answers[number]=Number(b.dataset.option);persist();render();return;}
 if(a==='test-next'||a==='test-prev'||a==='test-jump'){if(!state.activeTest)return;state.activeTest.index=a==='test-jump'?Number(b.dataset.index):Math.max(0,Math.min(29,state.activeTest.index+(a==='test-next'?1:-1)));persist();render();return;}
 if(a==='submit-test'&&state.activeTest){const n=30-Object.keys(state.activeTest.answers).length;confirmDialog('Ready to submit?',n?`You have ${n} unanswered question${n===1?'':'s'}. These will count as incorrect. You can cancel to finish them.`:'All 30 questions are answered. Submit to see and save your result.','confirm-submit');return;}
 if(a==='confirm-submit'){finishTest('submitted');return;}
 if(a==='result'){resultId=id;go('result');return;}
});
document.addEventListener('submit',e=>{if(e.target.id!=='session-form')return;e.preventDefault();const name=new FormData(e.target).get('name').trim();if(!name)return;const id=e.target.dataset.id;if(id)state.sessions.find(s=>s.id===id).name=name;else{const s={id:uid(),name,createdAt:Date.now(),completed:{},current:null,stars:[]};state.sessions.push(s);state.activeSession=s.id;}persist();closeModal();render();});
document.addEventListener('change',async e=>{
 if(e.target.id==='session-select'){state.activeSession=e.target.value;status={};persist();render();}
 if(e.target.id==='grid-filter'){filter=e.target.value;render();}
 if(e.target.id==='import-file'&&e.target.files[0]){try{const text=await e.target.files[0].text();if(confirm('Replace the progress in this browser with this backup? Export first if you want to keep the current data.')){state=importBackup(text);histories.clear();status={};starQueue=null;render();toast('Backup restored.');}}catch(err){toast(`Could not import: ${err.message}`);}e.target.value='';}
});
window.addEventListener('hashchange',()=>{status={};if(route()==='starred'){histories.delete('starred');starQueue=null;starIndex=0;}render();main.focus();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key==='territory.practice.v1'){state=load();histories.clear();status={};starQueue=null;render();toast('Progress updated from another tab.');}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)timer();});
setInterval(timer,1000);
persist();render();
