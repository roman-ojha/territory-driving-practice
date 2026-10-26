import {STORAGE_KEY,freshState,migrateState} from './model.js';
export let storageIssue='';
export function load(){
  try {const raw=localStorage.getItem(STORAGE_KEY);if(raw){return migrateState(JSON.parse(raw));}return freshState();}
  catch(e){storageIssue='Saved progress could not be loaded. Export a backup before making changes. Your existing stored data has not been replaced.';return freshState();}
}
export function save(state){
  if(storageIssue)return false;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
  catch(e){storageIssue='Your browser could not save progress. Export a backup from My sessions before closing this page.';return false;}
}
export function exportBackup(state){
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`territory-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function importBackup(text){const data=migrateState(JSON.parse(text));localStorage.setItem(STORAGE_KEY,JSON.stringify(data));storageIssue='';return data;}
