"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {BellRing,X} from 'lucide-react';
import {useMember} from './session';
import {autoSetupPush,pushDisabled} from '../../lib/push-client';
export function PushBootstrap(){
 const member=useMember();const [remind,setRemind]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;const sync=async()=>{if(pushDisabled(member.id)||!window.isSecureContext||!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window)){setRemind(false);return;}try{const enabled=await autoSetupPush(member.id);if(alive)setRemind(!enabled&&'Notification'in window&&Notification.permission==='default');}catch{if(alive){setError('Chưa đăng ký được thông báo. Bạn có thể thử lại hoặc kiểm tra trong Hồ sơ.');setRemind(true);}}};
  void sync();const wake=()=>{if(document.visibilityState==='visible')void sync();};window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);window.addEventListener('haco-push-preference',wake);window.addEventListener('storage',wake);
  return()=>{alive=false;window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);window.removeEventListener('haco-push-preference',wake);window.removeEventListener('storage',wake);};
 },[member.id]);
 async function allow(){setBusy(true);setError('');try{await Notification.requestPermission();const enabled=await autoSetupPush(member.id);setRemind(!enabled&&Notification.permission==='default');}catch{setError('Chưa bật được thông báo. Kiểm tra trong Hồ sơ cá nhân.');}finally{setBusy(false);}}
 if(!remind)return null;
 return <aside className="push-onboarding" aria-label="Cho phép thông báo"><BellRing size={20}/><div><strong>Nhận thông báo Haco</strong><p>{error||'Cho phép trình duyệt báo tin nhắn và công việc mới. Có thể tắt trong Hồ sơ cá nhân.'}</p><button className="primary-button" disabled={busy} onClick={()=>void allow()}>{busy?'Đang đăng ký…':'Cho phép thông báo'}</button><Link href="/admin/profile">Cài đặt trong Hồ sơ</Link></div><button className="icon-button" aria-label="Đóng lời nhắc thông báo" onClick={()=>setRemind(false)}><X size={17}/></button></aside>;
}
