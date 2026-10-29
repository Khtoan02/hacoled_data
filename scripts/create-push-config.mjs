import {writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import webpush from 'web-push';
const path='.env.push.local';
if(existsSync(path)){console.log('Đã có .env.push.local; giữ nguyên khóa hiện tại.');process.exit(0);}
const keys=webpush.generateVAPIDKeys();
writeFileSync(path,`WEB_PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}\nWEB_PUSH_VAPID_PRIVATE_KEY=${keys.privateKey}\nWEB_PUSH_SUBJECT=https://hacoled.com\nCRON_SECRET=${randomBytes(48).toString('base64url')}\n`,{mode:0o600,flag:'wx'});
console.log('Đã tạo .env.push.local (chỉ máy này đọc được, Git bỏ qua). Thêm CRON_SECRET vào Vercel Production rồi redeploy. Chỉ thêm cặp WEB_PUSH_VAPID_* nếu chưa có khóa đẩy trên máy chủ; không thay khóa đang dùng tùy tiện. Không chia sẻ khóa riêng hoặc CRON_SECRET trong chat.');
