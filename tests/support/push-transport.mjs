// Test-only HTTPS transport: real encryption/VAPID runs, no fixture push reaches the Internet.
import https from 'node:https';
import {Writable} from 'node:stream';
import {EventEmitter} from 'node:events';
const original=https.request,attempts=new Map();
https.request=function(options,callback){
 const host=options?.hostname,path=options?.path??'';
 if(host!=='fcm.googleapis.com'||!path.startsWith('/hacoled-test/'))return original.apply(this,arguments);
 const count=(attempts.get(path)??0)+1;attempts.set(path,count);
 const request=new Writable({write(_chunk,_encoding,done){done();},final(done){
  const response=new EventEmitter();response.statusCode=path.includes('/gone/')?410:path.includes('/retry/')&&count===1?503:201;response.headers={};
  queueMicrotask(()=>{callback(response);queueMicrotask(()=>response.emit('end'));});done();
 }});
 return request;
};
