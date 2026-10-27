import {esc,button,heading,empty} from './ui.js';
import {decodeSession,shareLink} from './share.js';
import qrcode from './vendor/qrcode.js';

export function sharingDialog(session,href){
 const link=shareLink(session,href);
 let qr;
 try{const code=qrcode(0,'M');code.addData(link);code.make();qr=code.createSvgTag({cellSize:5,margin:20,scalable:true});}
 catch{qr='<p>This link is too long for a QR code. Use Copy link below instead.</p>';}
 return `<div class="panel-head"><h2>Take your progress with you.</h2>${button('close','Close ×','secondary')}</div><p>Scan with your phone camera, or send yourself the link.</p><div class="share-qr" role="img" aria-label="QR code to import ${esc(session.name)}">${qr}</div><h3>${esc(session.name)}</h3><p>${Object.keys(session.completed).length} completed · ${session.stars.length} starred</p><label class="form-label">Session link<input id="share-link" readonly value="${esc(link)}"></label><div class="session-actions">${button('copy-session-link','Copy link','primary')}</div><p id="share-message" role="status"></p><p class="fine-print">A snapshot, not live sync. Includes the session name, completion and stars; excludes test history and answer dates. Anyone with this link can import it. The QR code is generated on your device.</p>${new URL(href).hostname==='127.0.0.1'||new URL(href).hostname==='localhost'?'<p class="fine-print">This link opens your GitHub Pages website. Publish the sharing update there before scanning it on your phone.</p>':''}`;
}
export function sharedPreview(token){
 try{const s=decodeSession(token);return heading('SESSION TRANSFER','Pick up on this device.','Review this shared snapshot before adding it to your sessions.')+`<section class="panel"><h2>${esc(s.name)}</h2><p>${Object.keys(s.completed).length} completed · ${s.stars.length} starred · ${357-Object.keys(s.completed).length} remaining</p><p>This adds a separate session. Your existing sessions and test results stay unchanged. Future progress is not automatically synced.</p><div class="session-actions">${button('import-shared','Import as a new session','primary')}${button('sessions','Cancel','secondary')}</div><p id="import-share-message" role="status"></p></section>`;}
 catch(e){return heading('SESSION TRANSFER','This link couldn’t be opened.','')+empty('Check the link',esc(e.message),button('sessions','Go to my sessions','secondary'));}
}
