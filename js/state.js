export const STORAGE_KEY = 'realImperioFC.v1';
export const SESSION_KEY = 'realImperioFC.session';
export const ADMIN_CONFIG_KEY = 'realImperioFC.localAdmins.v1';

export const DEFAULT_DATA = {
  team: {
    name: 'Real Império FC', neighborhood: 'Indianópolis', city: 'Caruaru-PE',
    generalAdmin: 'italorodrigo550@gmail.com', founded: '', trainingPlace: 'Indianópolis, Caruaru-PE',
    description: 'O Real Império FC representa a paixão pelo futebol em Indianópolis, Caruaru-PE. Este espaço reúne a agenda do time, notícias, elenco e registros dos momentos vividos dentro e fora de campo.'
  },
  events: [
    { id:'evt_1', type:'training', title:'Treino do elenco', date:'2026-09-10', time:'19:30', place:'Indianópolis, Caruaru-PE', opponent:'', notes:'Chegar com antecedência para organização.' },
    { id:'evt_2', type:'game', title:'Próximo jogo', date:'2026-09-13', time:'09:00', place:'A confirmar', opponent:'Adversário a confirmar', notes:'Detalhes podem ser atualizados pelo administrador.' },
    { id:'evt_3', type:'training', title:'Treino técnico', date:'2026-09-17', time:'19:30', place:'Indianópolis, Caruaru-PE', opponent:'', notes:'' }
  ],
  news: [{ id:'news_1', title:'Aplicativo do Real Império FC', body:'O novo espaço do Real Império FC já está em construção para reunir agenda, notícias, elenco e fotos do time em um só lugar.', date:'2026-09-08' }],
  players: [],
  gallery: [{ id:'gal_1', image:'assets/logo-real-imperio.svg', caption:'Escudo oficial do Real Império FC', date:'2026-09-08' }],
  audit: []
};

const clone = v => JSON.parse(JSON.stringify(v));
export const state = {
  data: loadData(), session: loadSession(), currentView: 'home', adminTab:'dashboard', agendaFilter:'all'
};

export function loadData(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved) return clone(DEFAULT_DATA);
    return {...clone(DEFAULT_DATA), ...saved,
      team:{...clone(DEFAULT_DATA.team), ...(saved.team||{})},
      events:Array.isArray(saved.events)?saved.events:clone(DEFAULT_DATA.events),
      news:Array.isArray(saved.news)?saved.news:clone(DEFAULT_DATA.news),
      players:Array.isArray(saved.players)?saved.players:[],
      gallery:Array.isArray(saved.gallery)?saved.gallery:clone(DEFAULT_DATA.gallery),
      audit:Array.isArray(saved.audit)?saved.audit:[]};
  } catch { return clone(DEFAULT_DATA); }
}
export function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); }
function loadSession(){ try{return JSON.parse(sessionStorage.getItem(SESSION_KEY))||null}catch{return null} }
export function saveSession(s){ state.session=s; s?sessionStorage.setItem(SESSION_KEY,JSON.stringify(s)):sessionStorage.removeItem(SESSION_KEY); }
export const isAdmin=()=>['admin','superadmin'].includes(state.session?.role);
export const currentPlayer=()=>state.session?.role==='player'?state.data.players.find(p=>p.id===state.session.playerId)||null:null;
export const uid=(p='id')=>`${p}_${crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(16).slice(2)}`;
export async function sha256(v){const b=new TextEncoder().encode(String(v).trim().toLowerCase());const d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function getLocalAdmins(){try{return JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY))||[]}catch{return[]}}
export function setLocalAdmins(admins){localStorage.setItem(ADMIN_CONFIG_KEY,JSON.stringify(admins))}
export const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export function safeImageSrc(v=''){const s=String(v).trim();return /^assets\//i.test(s)||/^https?:\/\//i.test(s)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)?s:''}
export function parseDate(s){return s?new Date(`${s}T12:00:00`):null}
export function formatDate(s,o={}){const d=parseDate(s);return !d||Number.isNaN(d.getTime())?'Data a confirmar':new Intl.DateTimeFormat('pt-BR',o).format(d)}
export function todayIso(){const n=new Date(),l=new Date(n.getTime()-n.getTimezoneOffset()*60000);return l.toISOString().slice(0,10)}
export function upcomingEvents(){const t=todayIso();return [...state.data.events].filter(e=>!e.date||e.date>=t).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))}
export function logAction(action){state.data.audit.unshift({id:uid('audit'),action,at:new Date().toISOString(),role:state.session?.role||'anonymous'});state.data.audit=state.data.audit.slice(0,100)}
