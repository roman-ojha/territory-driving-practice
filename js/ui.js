export const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const date = value => new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
export const percent=(n,total=357)=>Math.round(n/total*100);
export const heading=(eyebrow,title,description,action='')=>`<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
export const button=(action,label,cls='primary',extra='')=>`<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
export const empty=(title,description,action='')=>`<div class="empty-state"><span class="empty-symbol">✧</span><h2>${title}</h2><p>${description}</p>${action}</div>`;
export const progress=(done,total=357)=>`<div class="progress" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${percent(done,total)}%"></span></div>`;
export function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4000);}
export function modal(html){const dialog=document.querySelector('#modal');document.querySelector('#modal-content').innerHTML=html;dialog.showModal();}
export const closeModal=()=>document.querySelector('#modal').close();
