"use client";
export function pushRequest(memberId:string,init?:RequestInit){const headers=new Headers(init?.headers);headers.set('X-Haco-Member',memberId);return fetch('/api/push',{...init,headers});}
const key=(memberId:string)=>`haco-push-disabled:${memberId}`;
export function pushDisabled(memberId:string){try{return localStorage.getItem(key(memberId))==='true';}catch{return false;}}
export function setPushDisabled(memberId:string,disabled:boolean){try{localStorage.setItem(key(memberId),String(disabled));}catch{}window.dispatchEvent(new Event('haco-push-preference'));}
function applicationKey(value:string){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function matches(subscription:PushSubscription,key:string){const actual=subscription.options.applicationServerKey;if(!actual)return false;const expected=applicationKey(key),bytes=new Uint8Array(actual);return bytes.length===expected.length&&bytes.every((v,i)=>v===expected[i]);}
const running=new Map<string,Promise<boolean>>();
const prompted=new Set<string>();
export async function waitForPushSetup(memberId:string){await running.get(memberId)?.catch(()=>{});}
export function autoSetupPush(memberId:string):Promise<boolean>{
 const current=running.get(memberId);if(current)return current;
 const work=(async()=>{
  if(pushDisabled(memberId)||!window.isSecureContext||!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window)||Notification.permission==='denied')return false;
  const response=await pushRequest(memberId,{cache:'no-store'}),config=await response.json();if(!response.ok||config.viewer_id!==memberId||!config.configured||!config.publicKey||pushDisabled(memberId))return false;
  if(Notification.permission==='default'){
   // Browsers may suppress an on-load request. The visible reminder offers a user-gesture fallback.
   if(prompted.has(memberId))return false;prompted.add(memberId);
   try{await Notification.requestPermission();}catch{return false;}
  }
  if(Notification.permission!=='granted'||pushDisabled(memberId))return false;
  await navigator.serviceWorker.register('/sw.js',{scope:'/'});const registration=await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();
  if(subscription){const status=await pushRequest(memberId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',endpoint:subscription.endpoint})}),data=await status.json();if(!status.ok)throw Error(data.error||'Chưa kiểm tra được đăng ký thông báo.');
   if(data.enabled&&matches(subscription,config.publicKey))return true;
   // Rebind browser registration to the current authenticated session, never silently reuse another session.
   await subscription.unsubscribe();subscription=null;
  }
  if(pushDisabled(memberId))return false;
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey(config.publicKey)});
  if(pushDisabled(memberId)){await subscription.unsubscribe();return false;}
  const saved=await pushRequest(memberId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:subscription.toJSON()})}),result=await saved.json();if(!saved.ok)throw Error(result.error||'Chưa đăng ký được thông báo.');
  window.dispatchEvent(new Event('haco-push-state'));return true;
 })();running.set(memberId,work);void work.finally(()=>{if(running.get(memberId)===work)running.delete(memberId);window.dispatchEvent(new Event('haco-push-state'));}).catch(()=>{});return work;
}
