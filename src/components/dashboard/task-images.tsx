"use client";
import {ImagePlus,Upload,X} from 'lucide-react';
import {MAX_IMAGE_BYTES} from '../../lib/task-attachments';
export type PendingTaskImage={id:string;file:File;preview:string};
export async function prepareTaskImage(file:File):Promise<File>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Chọn ảnh PNG, JPEG hoặc WebP.');
 if(file.size>10*1024*1024)throw Error('Ảnh gốc tối đa 10 MB. Hãy giảm dung lượng trước khi chọn.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>40000000)throw Error('Ảnh quá lớn. Hãy giảm kích thước trước khi chọn.');
  const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.85));
  if(!blob||blob.size>MAX_IMAGE_BYTES)throw Error('Ảnh sau tối ưu vẫn lớn hơn 2 MB. Hãy chọn ảnh nhỏ hơn.');
  return new File([blob],`${file.name.replace(/\.[^.]+$/,'')||'anh-minh-chung'}.webp`,{type:'image/webp'});
 }finally{bitmap.close();}
}
export function TaskImagePicker({pending,disabled,onFiles,onRemove}:{pending:PendingTaskImage[];disabled:boolean;onFiles:(files:File[])=>void;onRemove:(id:string)=>void}){
 return <><div className={`task-image-drop ${disabled?'disabled':''}`} tabIndex={disabled?-1:0} aria-label="Vùng dán ảnh minh chứng" onDragOver={e=>{if(!disabled&&e.dataTransfer.types.includes('Files'))e.preventDefault();}} onDrop={e=>{e.preventDefault();if(!disabled)onFiles(Array.from(e.dataTransfer.files));}}>
 <ImagePlus size={24}/><div><strong>Dán ảnh hoặc kéo ảnh vào đây</strong><p>Ctrl+V / ⌘V · PNG, JPEG, WebP · Ảnh được tối ưu trước khi lưu</p></div>
 <label className="secondary-button image-file-label"><Upload size={16}/>Chọn ảnh từ máy<input type="file" aria-label="Chọn ảnh minh chứng" accept="image/png,image/jpeg,image/webp" multiple disabled={disabled} onChange={e=>{onFiles(Array.from(e.target.files||[]));e.target.value='';}}/></label>
 </div>
 {pending.length>0&&<div className="pending-image-grid">{pending.map(p=><div className="pending-image" key={p.id}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.preview} alt={`Ảnh chờ lưu: ${p.file.name}`}/><span>Chờ lưu · {Math.ceil(p.file.size/1024)} KB</span><button className="icon-button" type="button" disabled={disabled} aria-label={`Bỏ ảnh chờ lưu ${p.file.name}`} onClick={()=>onRemove(p.id)}><X size={16}/></button></div>)}</div>}</>;
}
