export interface ImportChannel {id:string;name:string;handle:string;url:string;platform:string}
export const normalizeImportIdentity=(value:unknown)=>String(value??'').trim().toLocaleLowerCase('vi').replace(/^@/,'');
export function resolveImportChannels(value:unknown,channels:ImportChannel[]){
 const tokens=String(value??'').split('|').map(v=>v.trim()).filter(Boolean),selected:ImportChannel[]=[],errors:string[]=[];
 if(tokens.length>20)errors.push('Tối đa 20 kênh trong một công việc.');
 const seen=new Set<string>();
 for(const token of tokens){
  const normalized=normalizeImportIdentity(token);
  const matches=channels.filter(c=>[c.id,c.name,c.handle,c.url].map(normalizeImportIdentity).filter(Boolean).includes(normalized));
  if(!matches.length){errors.push(`Không tìm thấy kênh "${token}" đang hoạt động. Dùng đúng tên, @định danh, URL hoặc ID trong Tài khoản kênh.`);continue;}
  if(matches.length>1){errors.push(`Kênh "${token}" khớp ${matches.length} kênh: ${matches.slice(0,3).map(c=>`${c.platform} · ${c.name} (${c.url||c.id})`).join('; ')}. Dùng URL hoặc ID kênh chính xác.`);continue;}
  if(seen.has(matches[0].id)){errors.push(`Kênh "${token}" bị lặp trong cùng công việc.`);continue;}
  seen.add(matches[0].id);selected.push(matches[0]);
 }
 return {tokens,selected,errors};
}
