import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const path=new URL('../.env.local',import.meta.url);
let contents=existsSync(path)?readFileSync(path,'utf8'):'';
const match=contents.match(/^SOCIAL_CREDENTIALS_KEY=(.*)$/m);
if(match&&/^[0-9a-f]{64}$/i.test(match[1].trim())) {
 console.log('Khóa mã hóa đã có trong .env.local. Giữ nguyên khóa hiện tại.');
} else {
 if(match&&match[1].trim())throw new Error('Khóa hiện tại không hợp lệ. Không tự thay thế để tránh mất khả năng giải mã.');
 const line=`SOCIAL_CREDENTIALS_KEY=${randomBytes(32).toString('hex')}`;
 contents=match?contents.replace(/^SOCIAL_CREDENTIALS_KEY=.*$/m,line):`${contents}\n${line}\n`;
 writeFileSync(path,contents,{mode:0o600});
 console.log('Đã tạo khóa trong .env.local (được Git bỏ qua). Thêm cùng giá trị vào Vercel Production và giữ bản sao an toàn.');
}
