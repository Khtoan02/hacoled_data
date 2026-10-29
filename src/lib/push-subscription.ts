import {ECDH} from 'node:crypto';
export type PushSubscriptionInput={endpoint:string;keys:{p256dh:string;auth:string}};
export function validPushEndpoint(value:unknown):value is string{
 if(typeof value!=='string'||value.length>4096)return false;
 try{const u=new URL(value),host=u.hostname.toLowerCase();return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&(host==='fcm.googleapis.com'||host==='web.push.apple.com'||host==='updates.push.services.mozilla.com'||host.endsWith('.push.services.mozilla.com')||host.endsWith('.notify.windows.com'));}catch{return false;}
}
export function parsePushSubscription(value:unknown):PushSubscriptionInput|null{
 if(!value||typeof value!=='object')return null;const v=value as PushSubscriptionInput;
 if(!validPushEndpoint(v.endpoint)||!v.keys||typeof v.keys.p256dh!=='string'||typeof v.keys.auth!=='string'||!/^[\w-]{87}$/.test(v.keys.p256dh)||!/^[\w-]{22}$/.test(v.keys.auth))return null;
 try{const point=Buffer.from(v.keys.p256dh,'base64url');if(point.length!==65||point[0]!==4||Buffer.from(v.keys.auth,'base64url').length!==16)return null;ECDH.convertKey(point,'prime256v1');}catch{return null;}
 return {endpoint:v.endpoint,keys:{p256dh:v.keys.p256dh,auth:v.keys.auth}};
}
