import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{
 return {name:'HacoLED Data',short_name:'HacoLED',description:'Công việc, KPI và chat nội bộ HacoLED',start_url:'/admin',scope:'/',display:'standalone',background_color:'#f5f6fa',theme_color:'#bd2027',icons:[{src:'/icon.png',sizes:'any',type:'image/png',purpose:'any'}]};
}
