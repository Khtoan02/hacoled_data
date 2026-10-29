import 'server-only';
import {createECDH,hkdfSync} from 'node:crypto';
export function pushConfig(){
 let publicKey=process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim(),privateKey=process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
 const master=process.env.SOCIAL_CREDENTIALS_KEY?.trim();
 // Domain-separated keys: do not reuse the channel encryption key as a VAPID private key.
 if(!publicKey&&!privateKey&&/^[0-9a-f]{64}$/i.test(master??'')){
  for(let counter=0;counter<4;counter++){
   try{const key=Buffer.from(hkdfSync('sha256',Buffer.from(master!,'hex'),'hacoled-data-web-push-v1',`vapid-p256:${counter}`,32)),curve=createECDH('prime256v1');curve.setPrivateKey(key);privateKey=key.toString('base64url');publicKey=curve.getPublicKey().toString('base64url');break;}catch{}
  }
 }
 if(!publicKey||!privateKey)return null;
 try{const curve=createECDH('prime256v1');curve.setPrivateKey(Buffer.from(privateKey,'base64url'));if(curve.getPublicKey().toString('base64url')!==publicKey)return null;}catch{return null;}
 const subject=process.env.WEB_PUSH_SUBJECT?.trim()||'https://hacoled.com';
 try{const url=new URL(subject);if(!['https:','mailto:'].includes(url.protocol)||url.username||url.password)return null;}catch{return null;}
 return {publicKey,privateKey,subject};
}
