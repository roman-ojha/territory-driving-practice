import {BANK_SIZE,uid} from './model.js';

export const PUBLIC_SITE='https://roman-ojha.github.io/territory-driving-practice/';
const METHODS=[null,'correct','revealed','imported'];
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
function decode(text){
 if(typeof text!=='string'||!text.length||text.length>1600||!/^[A-Za-z0-9_-]+$/.test(text))throw Error('Invalid sharing data.');
 const bytes=Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 if(encode(bytes)!==text)throw Error('Invalid sharing data.');
 return bytes;
}
export function encodeSession(session){
 // Three bits per question: two for completion method and one for its star.
 const bytes=new Uint8Array(Math.ceil(BANK_SIZE*3/8));
 for(let i=0;i<BANK_SIZE;i++){
  const method=session.completed[i+1]?.method;
  const code=(method?METHODS.indexOf(method):0)|(session.stars.includes(i+1)?4:0);
  for(let bit=0;bit<3;bit++)if(code&(1<<bit))bytes[Math.floor((i*3+bit)/8)]|=1<<((i*3+bit)%8);
 }
 return encode(new TextEncoder().encode(JSON.stringify({v:1,bank:'nt-2021-357',name:session.name,data:encode(bytes)})));
}
export function decodeSession(token){
 try{
  const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decode(token)));
  if(payload.v!==1||payload.bank!=='nt-2021-357'||typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>80)throw Error();
  const bytes=decode(payload.data);
  if(bytes.length!==Math.ceil(BANK_SIZE*3/8)||(bytes.at(-1)&128))throw Error();
  const completed={},stars=[];
  for(let i=0;i<BANK_SIZE;i++){
   let code=0;for(let bit=0;bit<3;bit++)if(bytes[Math.floor((i*3+bit)/8)]&(1<<((i*3+bit)%8)))code|=1<<bit;
   if(code&3)completed[i+1]={method:METHODS[code&3],at:null};
   if(code&4)stars.push(i+1);
  }
  return {name:payload.name,completed,stars};
 }catch{throw Error('This session link is invalid, incomplete, or from an unsupported question bank. Ask the sender to share it again.');}
}
export function shareLink(session,href){
 const url=new URL(href);
 // A phone cannot open the PC's localhost. Use this project's public site there.
 if(['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.protocol==='file:')return PUBLIC_SITE+'#share='+encodeSession(session);
 url.search='';url.hash='share='+encodeSession(session);return url.href;
}
export function importSharedSession(state,snapshot){
 const name=state.sessions.some(s=>s.name===snapshot.name)?snapshot.name.slice(0,66)+' (shared copy)':snapshot.name;
 const session={id:uid(),name,createdAt:Date.now(),current:null,completed:structuredClone(snapshot.completed),stars:[...snapshot.stars]};
 return {...state,activeSession:session.id,sessions:[...state.sessions,session]};
}
