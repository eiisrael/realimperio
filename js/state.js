export const STORAGE_KEY = 'realImperioFC.v1';
export const SESSION_KEY = 'realImperioFC.session';
export const ADMIN_CONFIG_KEY = 'realImperioFC.localAdmins.v1';

const DEFAULT_LINEUP = {
  formation: '4-3-3',
  baseFormation: '4-3-3',
  customized: false,
  slots: {
    p1: null, p2: null, p3: null, p4: null, p5: null,
    p6: null, p7: null, p8: null, p9: null, p10: null,
    gk: null
  },
  coordinates: {}
};

const DEFAULT_COACH = {
  name: '',
  photo: '',
  whatsapp: '',
  bio: '',
  role: 'Técnico'
};

export const DEFAULT_DATA = {
  team: {
    name: 'Real Império FC', neighborhood: 'Indianópolis', city: 'Caruaru-PE',
    generalAdmin: 'italorodrigo550@gmail.com', founded: '', trainingPlace: 'Indianópolis, Caruaru-PE',
    description: 'O Real Império FC representa a paixão pelo futebol em Indianópolis, Caruaru-PE. Este espaço reúne a agenda do time, notícias, elenco e registros dos momentos vividos dentro e fora de campo.'
  },
  coach: DEFAULT_COACH,
  events: [
    { id:'evt_1', type:'training', title:'Treino do elenco', date:'2026-09-10', time:'19:30', place:'Indianópolis, Caruaru-PE', opponent:'', notes:'Chegar com antecedência para organização.' },
    { id:'evt_2', type:'game', title:'Próximo jogo', date:'2026-09-13', time:'09:00', place:'A confirmar', opponent:'Adversário a confirmar', notes:'Detalhes podem ser atualizados pelo administrador.' },
    { id:'evt_3', type:'training', title:'Treino técnico', date:'2026-09-17', time:'19:30', place:'Indianópolis, Caruaru-PE', opponent:'', notes:'' }
  ],
  news: [{ id:'news_1', title:'Aplicativo do Real Império FC', body:'O novo espaço do Real Império FC já está em construção para reunir agenda, notícias e elenco do time em um só lugar.', date:'2026-09-08', image:'' }],
  players: [],
  lineup: DEFAULT_LINEUP,
  gallery: [],
  audit: []
};

const clone = v => JSON.parse(JSON.stringify(v));
let remoteSaveHandler = null;

function normalizeData(saved){
  if(!saved || typeof saved!=='object') return clone(DEFAULT_DATA);

  const savedLineup=saved.lineup||{},legacy=savedLineup.slots||{};
  const slots={
    ...clone(DEFAULT_LINEUP.slots),
    ...legacy,
    p1:legacy.p1??legacy.lw??null,
    p2:legacy.p2??legacy.st??null,
    p3:legacy.p3??legacy.rw??null,
    p4:legacy.p4??legacy.lcm??null,
    p5:legacy.p5??legacy.cm??null,
    p6:legacy.p6??legacy.rcm??null,
    p7:legacy.p7??legacy.lb??null,
    p8:legacy.p8??legacy.lcb??null,
    p9:legacy.p9??legacy.rcb??null,
    p10:legacy.p10??legacy.rb??null,
    gk:legacy.gk??null
  };
  const legacyAdminName=String(saved.team?.generalAdmin||'').trim();
  const migratedCoach={...clone(DEFAULT_COACH), ...(saved.coach||{})};
  if(!migratedCoach.name&&legacyAdminName&&!legacyAdminName.includes('@'))migratedCoach.name=legacyAdminName;

  return {
    ...clone(DEFAULT_DATA),
    ...saved,
    team:{...clone(DEFAULT_DATA.team), ...(saved.team||{})},
    coach:migratedCoach,
    events:Array.isArray(saved.events)?saved.events:clone(DEFAULT_DATA.events),
    news:Array.isArray(saved.news)?saved.news.map(n=>({...n,image:n.image||''})):clone(DEFAULT_DATA.news),
    players:Array.isArray(saved.players)?saved.players.map(p=>({
      ...p,
      position:p.position==='Outro'?'Reserva':p.position||'',
      goals:Math.max(0,Number.parseInt(p.goals,10)||0),
      photo:p.photo||'',
      bio:p.bio||'',
      whatsapp:p.whatsapp||'',
      number:p.number||'',
      status:p.status||'pending'
    })):[],
    lineup:{
      ...clone(DEFAULT_LINEUP),
      ...savedLineup,
      slots,
      coordinates:{...(savedLineup.coordinates||{})}
    },
    gallery:[],
    audit:Array.isArray(saved.audit)?saved.audit:[]
  };
}

export const state = {
  data: loadData(),
  session: loadSession(),
  currentView: 'home',
  adminTab:'dashboard',
  agendaFilter:'all',
  lineupSelectedPlayerId:''
};

export function loadData(){
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeData(saved);
  } catch {
    return clone(DEFAULT_DATA);
  }
}

export function setData(data){
  state.data=normalizeData(data);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state.data));
  return state.data;
}

export function setRemoteSaveHandler(handler){
  remoteSaveHandler=typeof handler==='function'?handler:null;
}

export function saveData(options={}){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  if(options.remote===false || !remoteSaveHandler)return Promise.resolve();
  try{
    const task=Promise.resolve(remoteSaveHandler(state.data));
    task.catch(error=>console.error('Falha ao sincronizar com o servidor:',error));
    return task;
  }catch(error){
    return Promise.reject(error);
  }
}

function loadSession(){
  try{return JSON.parse(sessionStorage.getItem(SESSION_KEY))||null}catch{return null}
}

export function saveSession(s){
  state.session=s;
  s?sessionStorage.setItem(SESSION_KEY,JSON.stringify(s)):sessionStorage.removeItem(SESSION_KEY);
}

export const isAdmin=()=>['admin','superadmin'].includes(state.session?.role);
export const currentPlayer=()=>state.session?.role==='player'?state.data.players.find(p=>p.id===state.session.playerId)||null:null;
export const uid=(p='id')=>`${p}_${crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(16).slice(2)}`;
export async function sha256(v){const b=new TextEncoder().encode(String(v).trim().toLowerCase());const d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function getLocalAdmins(){try{return JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY))||[]}catch{return[]}}
export function setLocalAdmins(admins){localStorage.setItem(ADMIN_CONFIG_KEY,JSON.stringify(admins))}
export const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','"':'&quot;'}[c]));
export function safeImageSrc(v=''){const s=String(v).trim();return /^assets\//i.test(s)||/^https?:\/\//i.test(s)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)?s:''}
export function parseDate(s){return s?new Date(`${s}T12:00:00`):null}
export function formatDate(s,o={}){const d=parseDate(s);return !d||Number.isNaN(d.getTime())?'Data a confirmar':new Intl.DateTimeFormat('pt-BR',o).format(d)}
export function todayIso(){const n=new Date(),l=new Date(n.getTime()-n.getTimezoneOffset()*60000);return l.toISOString().slice(0,10)}
export function upcomingEvents(){const t=todayIso();return [...state.data.events].filter(e=>!e.date||e.date>=t).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))}
export function logAction(action){state.data.audit.unshift({id:uid('audit'),action,at:new Date().toISOString(),role:state.session?.role||'anonymous'});state.data.audit=state.data.audit.slice(0,100)}
