import {OUTPUT_TYPES,type OutputType} from './kpis';
import {ROLE_POLICIES,type MemberRoleId} from './security/rbac';
import {SOCIAL_PLATFORMS,type SocialPlatform} from './social';
export const TASK_IMPORT_HEADERS=['ten_cong_viec','mo_ta_chung','email_nguoi_thuc_hien','kenh','dinh_dang','so_luong','han_hoan_thanh','trang_thai','checklist','tuyen_noi_dung','dinh_dang_noi_dung','cta','link_website','tu_khoa_chinh','slug','link_tro_di','dinh_huong_noi_dung','ghi_chu_cong_viec'] as const;
export const TEMPLATE_MEMBER_ROLES=['marketing_manager','marketing_staff','marketing_intern'] as const;
export type TemplateMember={id:string;name:string;email:string;role:MemberRoleId};
export type TemplateChannel={id:string;name:string;platform:SocialPlatform;handle:string;url:string};
export type TemplateGoal={id:string;assignee_id:string;channel_id:string;output_type:OutputType;target:number};
const outputCodes:Record<OutputType,string>={post:'bai_viet',video:'video_dai',short_video:'video_doc_ngan',story:'video_doc_ngan',image:'thiet_ke_anh',livestream:'livestream',other:'khac'};
export function templateMembers(members:TemplateMember[]){return members.filter(m=>(TEMPLATE_MEMBER_ROLES as readonly string[]).includes(m.role));}
export function createTaskTemplate(members:TemplateMember[],channels:TemplateChannel[],goals:TemplateGoal[],month:string){
 const people=templateMembers(members),rows:Record<string,string>[]=[],lastDay=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate();
 const used=new Set<string>(),monthLabel=`${month.slice(5)}/${month.slice(0,4)}`;
 function sample(person:TemplateMember,channel:TemplateChannel|undefined,output:OutputType,goal?:TemplateGoal){
  const normalized=output==='story'?'short_video':output,key=`${person.id}:${channel?.id??''}:${normalized}`;
  if(used.has(key))return;used.add(key);
  const row:Record<string,string>=Object.fromEntries(TASK_IMPORT_HEADERS.map(k=>[k,'']));
  Object.assign(row,{ten_cong_viec:`MẪU - ${person.name} · ${OUTPUT_TYPES[normalized].label}${channel?` · ${channel.name}`:''}`,mo_ta_chung:'Điền nội dung, yêu cầu và kết quả cần bàn giao cho từng công việc.',email_nguoi_thuc_hien:person.email,kenh:channel?.id??'',dinh_dang:outputCodes[normalized],so_luong:'1',han_hoan_thanh:`${month}-${lastDay}`,trang_thai:'chua_bat_dau',checklist:'Chuẩn bị nội dung|Thực hiện|Kiểm tra và bàn giao',ghi_chu_cong_viec:`Dòng tham khảo, chưa phải việc đã giao. Sửa tên và bỏ tiền tố MẪU - trước khi import.${goal?` KPI tháng ${monthLabel}: ${goal.target} ${OUTPUT_TYPES[normalized].unit}; dòng này là ví dụ 1 việc, không phải toàn bộ chỉ tiêu.`:' Chưa có KPI phù hợp: việc sẽ nằm ngoài chỉ tiêu nếu không bổ sung KPI trước.'}${channel?` Kênh chính: ${SOCIAL_PLATFORMS[channel.platform]} · ${channel.name} · ${channel.url}. Giữ nguyên ID kênh hoặc chép từ danh mục.`:' Chọn ID kênh từ danh mục nếu cần; không tự đoán tên hoặc @định danh.'}`});
  if(normalized==='post'&&channel?.platform==='facebook')Object.assign(row,{tuyen_noi_dung:'Điền tuyến nội dung',dinh_dang_noi_dung:'Bài ảnh / carousel / nội dung chữ',cta:'Điền hành động mong muốn của người đọc'});
  if(normalized==='post'&&channel?.platform==='website')Object.assign(row,{tu_khoa_chinh:'Điền từ khóa chính',slug:'dien-slug-bai-viet',link_tro_di:channel.url});
  if(['video','short_video','livestream'].includes(normalized))row.dinh_huong_noi_dung='Điền chủ đề, hook, kịch bản, thời lượng và yêu cầu bàn giao.';
  row.ten_cong_viec=row.ten_cong_viec.slice(0,200);
  rows.push(row);
 }
 for(const goal of goals){const member=people.find(m=>m.id===goal.assignee_id),channel=channels.find(c=>c.id===goal.channel_id);if(member&&channel)sample(member,channel,goal.output_type,goal);}
 // Without an assigned KPI, provide an editable general task rather than guessing a person's channel.
 for(const member of people)if(!rows.some(r=>r.email_nguoi_thuc_hien===member.email))sample(member,undefined,'other');
 const directory={month,columns:TASK_IMPORT_HEADERS,instructions:[
  'Chỉ dùng email từ members và ID từ channels. Danh mục không gồm Giám đốc, Kinh doanh, Leader Marketing hoặc tài khoản tạm ngừng.',
  'Một dòng là một công việc. Xóa tiền tố MẪU - ở tên sau khi đã sửa nội dung; dòng còn tiền tố bị bỏ qua.',
  'Dùng ID kênh, nhiều ID phân cách bằng |; kênh đầu tiên là kênh chính để khớp KPI. Reels/Shorts là định dạng, không phải kênh riêng nếu chưa khai báo.',
  'Khớp KPI theo email người làm, kênh chính, loại sản phẩm và tháng của hạn hoàn thành. Mẫu không tự giao việc và không phân bổ toàn bộ chỉ tiêu.',
  'Dùng video_doc_ngan cho Shorts/Reels/TikTok, video_dai cho video dài, khac cho audit hoặc công việc khác. Số lượng là khối lượng của một công việc.',
 ],column_rules:{required:['ten_cong_viec','email_nguoi_thuc_hien'],han_hoan_thanh:`YYYY-MM-DD trong tháng ${month}; thay ngày cuối tháng mẫu bằng hạn thực tế của từng việc`,so_luong:'Số nguyên 1..100000; khối lượng một công việc, không phải tổng KPI tháng',facebook_post:['tuyen_noi_dung','dinh_dang_noi_dung'],website_post:['tu_khoa_chinh','slug'],video:['dinh_huong_noi_dung'],other:['ghi_chu_cong_viec']},members:people.map(m=>({...m,role_label:ROLE_POLICIES[m.role].label})),channels:channels.map(c=>({...c,platform_label:SOCIAL_PLATFORMS[c.platform]})),goals:goals.filter(g=>people.some(m=>m.id===g.assignee_id)&&channels.some(c=>c.id===g.channel_id)).map(g=>({...g,month,assignee_email:people.find(m=>m.id===g.assignee_id)!.email,channel_name:channels.find(c=>c.id===g.channel_id)!.name,csv_format:outputCodes[g.output_type],unit:OUTPUT_TYPES[g.output_type].unit})),formats:[...new Set(Object.values(outputCodes))],statuses:['chua_bat_dau','dang_thuc_hien','hoan_thanh'],samples:rows.slice(0,500),omitted_samples:Math.max(0,rows.length-500)};
 return directory;
}
export function importCsv(columns:readonly string[],rows:Record<string,unknown>[]){
 const quote=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;
 return '\uFEFF'+columns.map(quote).join(',')+'\r\n'+rows.map(r=>columns.map(k=>quote(r[k])).join(',')).join('\r\n')+'\r\n';
}
