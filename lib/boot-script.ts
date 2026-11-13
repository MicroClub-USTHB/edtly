import { routing } from "@/i18n/routing";
import {
  LOCALE_KEY,
  MODE_KEY,
  PARCOURS_KEY,
  START_VIEW_KEY,
  VIEW_ONCE_KEY,
} from "./stores/storage-keys";

const json = JSON.stringify;

export const bootScript = `(function(){try{var r=document.documentElement,i=(new Date().getDay()+1)%7;if(i<6)r.dataset.today=i;r.dataset.day=i<6?i:0;var o=sessionStorage.getItem(${json(VIEW_ONCE_KEY)});sessionStorage.removeItem(${json(VIEW_ONCE_KEY)});r.dataset.view=o||(localStorage.getItem(${json(START_VIEW_KEY)})==="week"?"week":"day");r.dataset.mode=localStorage.getItem(${json(MODE_KEY)})==="mine"?"mine":"full"}catch(e){}})()`;

export const resumeScript = (locale: string) =>
  `(function(){try{var p=JSON.parse(localStorage.getItem(${json(PARCOURS_KEY)}));if(p&&typeof p.path==="string"&&p.path.charAt(0)==="/"){var l=localStorage.getItem(${json(LOCALE_KEY)}),r=document.documentElement;if(${json(routing.locales)}.indexOf(l)<0)l=${json(locale)};r.dataset.resuming="";setTimeout(function(){delete r.dataset.resuming},4000);location.replace("/"+l+p.path)}}catch(e){}})()`;

export const staleParcoursScript = `(function(){try{var k=${json(PARCOURS_KEY)},p=JSON.parse(localStorage.getItem(k));if(p&&location.pathname.replace(/^\\/[a-z]{2}(?=\\/)/,"")===p.path)localStorage.removeItem(k)}catch(e){}})()`;
