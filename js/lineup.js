import {state,saveData,isAdmin,escapeHtml,safeImageSrc} from './state.js';

export const LINEUP_POSITIONS = [
  {slot:'lw', label:'Ponta Esquerda', short:'PE', x:20, y:14},
  {slot:'st', label:'Centroavante', short:'CA', x:50, y:11},
  {slot:'rw', label:'Ponta Direita', short:'PD', x:80, y:14},
  {slot:'lcm',label:'Meia Esquerda', short:'ME', x:26, y:38},
  {slot:'cm', label:'Meia Central', short:'MC', x:50, y:35},
  {slot:'rcm',label:'Meia Direita', short:'MD', x:74, y:38},
  {slot:'lb', label:'Lateral Esquerdo', short:'LE', x:16, y:64},
  {slot:'lcb',label:'Zagueiro Esquerdo', short:'ZE', x:38, y:61},
  {slot:'rcb',label:'Zagueiro Direito', short:'ZD', x:62, y:61},
  {slot:'rb', label:'Lateral Direito', short:'LD', x:84, y:64},
  {slot:'gk', label:'Goleiro', short:'GOL', x:50, y:87}
];

const slotIds=()=>LINEUP_POSITIONS.map(p=>p.slot);
const goals=p=>Math.max(0,Number.parseInt(p?.goals,10)||0);
const initials=name=>String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'FC';

export function ensureLineup(){
  if(!state.data.lineup||typeof state.data.lineup!=='object')state.data.lineup={formation:'4-3-3',slots:{}};
  if(!state.data.lineup.formation)state.data.lineup.formation='4-3-3';
  if(!state.data.lineup.slots||typeof state.data.lineup.slots!=='object')state.data.lineup.slots={};
  for(const slot of slotIds())if(!(slot in state.data.lineup.slots))state.data.lineup.slots[slot]=null;
  return state.data.lineup;
}

function approvedPlayers(){
  return [...state.data.players]
    .filter(p=>p.status==='approved')
    .sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||a.name.localeCompare(b.name));
}

function assignedPlayer(slot){
  const lineup=ensureLineup(),id=lineup.slots[slot];
  return id?state.data.players.find(p=>p.id===id&&p.status==='approved')||null:null;
}

function avatarHtml(player){
  const src=safeImageSrc(player?.photo||'');
  return src?`<img src="${escapeHtml(src)}" alt="Foto de ${escapeHtml(player.name)}">`:`<span class="lineup-initials">${escapeHtml(initials(player?.name))}</span>`;
}

function tooltipHtml(pos,player){
  if(!player)return `<span class="lineup-tooltip"><strong>Posição disponível</strong><span class="position">${escapeHtml(pos.label)}</span><p class="lineup-tooltip-bio">A administração ainda não definiu um atleta para esta posição.</p></span>`;
  const src=safeImageSrc(player.photo||''),g=goals(player);
  return `<span class="lineup-tooltip"><span class="lineup-tooltip-head"><span class="lineup-tooltip-avatar">${src?`<img src="${escapeHtml(src)}" alt="">`:`${escapeHtml(initials(player.name))}`}</span><span><strong>${escapeHtml(player.name)}</strong><span class="position">${escapeHtml(pos.label)}</span></span></span><span class="lineup-tooltip-grid"><span class="lineup-tooltip-stat"><span>Camisa</span><strong>${escapeHtml(player.number||'—')}</strong></span><span class="lineup-tooltip-stat"><span>Gols</span><strong>⚽ ${g}</strong></span><span class="lineup-tooltip-stat"><span>Posição</span><strong>${escapeHtml(player.position||'Jogador')}</strong></span><span class="lineup-tooltip-stat"><span>Status</span><strong>Titular</strong></span></span><p class="lineup-tooltip-bio">${escapeHtml(player.bio||'Descrição do jogador ainda não adicionada.')}</p></span>`;
}

function nodeHtml(pos,{admin=false}={}){
  const player=assignedPlayer(pos.slot),name=player?player.name.split(/\s+/)[0]:pos.short;
  const button=`<button type="button" class="lineup-player ${player?'':'is-empty'}" ${admin?`data-action="lineup-assign-slot" data-slot="${pos.slot}"`:''} aria-label="${escapeHtml(player?`${player.name} — ${pos.label}`:`${pos.label} — posição disponível`)}">${player?avatarHtml(player):`<span class="lineup-empty-abbr">${escapeHtml(pos.short)}</span>`}</button>`;
  return `<span class="lineup-player-node ${admin?'lineup-admin-node':''}" style="--x:${pos.x}%;--y:${pos.y}%">${button}${tooltipHtml(pos,player)}<span class="lineup-name">${escapeHtml(name)}</span>${admin&&player?`<button type="button" class="lineup-clear-node" data-action="lineup-clear-slot" data-slot="${pos.slot}" aria-label="Retirar ${escapeHtml(player.name)} desta posição">×</button>`:''}</span>`;
}

function pitchHtml({admin=false}={}){
  return `<div class="lineup-pitch-stage"><div class="lineup-pitch" aria-label="Campo com escalação em formação 4-3-3"><span class="pitch-center-dot"></span><span class="pitch-box top"></span><span class="pitch-box bottom"></span><span class="pitch-goal-box top"></span><span class="pitch-goal-box bottom"></span><span class="pitch-goal top"></span><span class="pitch-goal bottom"></span><span class="pitch-arc top"></span><span class="pitch-arc bottom"></span>${LINEUP_POSITIONS.map(p=>nodeHtml(p,{admin})).join('')}</div></div>`;
}

export function publicLineupHtml(){
  ensureLineup();
  const count=LINEUP_POSITIONS.filter(p=>assignedPlayer(p.slot)).length;
  return `<div class="page-head lineup-page-head"><div><span class="kicker">Time titular</span><h1>Escalação</h1><p>Conheça a formação titular do Real Império FC. Passe o mouse sobre um atleta — ou toque no celular — para ver nome, posição, camisa, saldo de gols e informações.</p></div><span class="lineup-formation-chip">⚽ Formação ${escapeHtml(state.data.lineup.formation)}</span></div><section class="lineup-section" id="public-lineup"><div class="lineup-shell"><div class="lineup-topbar"><div><strong>REAL IMPÉRIO FC · TITULARES</strong><span>${count}/11 posições definidas pela administração</span></div><span>Indianópolis · Caruaru-PE</span></div>${pitchHtml()}</div></section>`;
}

export function renderLineupPublic(){
  const view=document.querySelector('#view-lineup');
  if(!view)return;
  view.innerHTML=publicLineupHtml();
}

export function renderLineupAdmin(){
  const view=document.querySelector('#view-admin');
  if(!view||!isAdmin())return;
  const sidebar=view.querySelector('.admin-sidebar');
  if(sidebar&&!sidebar.querySelector('[data-admin-tab="lineup"]')){
    const button=document.createElement('button');
    button.className=`admin-tab ${state.adminTab==='lineup'?'active':''}`;
    button.dataset.adminTab='lineup';
    button.textContent='Escalação';
    const teamButton=sidebar.querySelector('[data-admin-tab="team"]');
    teamButton?sidebar.insertBefore(button,teamButton):sidebar.appendChild(button);
  }
  if(state.adminTab!=='lineup')return;
  const panel=view.querySelector('.admin-panel');
  if(!panel)return;
  ensureLineup();
  const players=approvedPlayers();
  if(!players.some(p=>p.id===state.lineupSelectedPlayerId))state.lineupSelectedPlayerId='';
  panel.innerHTML=`<div class="admin-toolbar"><div><h2>Escalação</h2><p class="form-help">Monte visualmente o time titular. Formação atual: <strong>${escapeHtml(state.data.lineup.formation)}</strong>.</p></div></div><article class="card card-accent"><div class="lineup-admin-toolbar"><div class="lineup-admin-select"><label for="lineup-player-select">Jogador para posicionar</label><select id="lineup-player-select"><option value="">Selecione um jogador...</option>${players.map(p=>`<option value="${p.id}" ${state.lineupSelectedPlayerId===p.id?'selected':''}>${escapeHtml(p.number?`${p.number} · ${p.name}`:p.name)} — ${escapeHtml(p.position||'Jogador')}</option>`).join('')}</select><p class="lineup-admin-help">Selecione um atleta e depois clique diretamente em uma posição do campo. Se ele já estiver escalado, será movido automaticamente.</p></div><button type="button" class="btn btn-danger btn-sm" data-action="lineup-clear-all">Limpar escalação</button></div><div class="lineup-shell"><div class="lineup-topbar"><div><strong>EDITOR VISUAL DA ESCALAÇÃO</strong><span>Clique nos pontos do campo para definir os titulares</span></div><span class="lineup-formation-chip">4-3-3</span></div>${pitchHtml({admin:true})}<div class="lineup-admin-legend"><span><strong>Dica:</strong> o × remove somente o atleta daquela posição.</span><span>${LINEUP_POSITIONS.filter(p=>assignedPlayer(p.slot)).length}/11 titulares definidos</span></div></div></article>`;
}

export function assignLineupPlayer(slot,playerId){
  if(!slotIds().includes(slot))return {ok:false,message:'Posição inválida.'};
  const player=state.data.players.find(p=>p.id===playerId&&p.status==='approved');
  if(!player)return {ok:false,message:'Selecione um jogador aprovado antes de clicar no campo.'};
  const lineup=ensureLineup();
  for(const key of slotIds())if(lineup.slots[key]===player.id)lineup.slots[key]=null;
  lineup.slots[slot]=player.id;
  saveData();
  return {ok:true,player};
}

export function clearLineupSlot(slot){
  if(!slotIds().includes(slot))return false;
  ensureLineup().slots[slot]=null;
  saveData();
  return true;
}

export function clearLineupAll(){
  const lineup=ensureLineup();
  for(const slot of slotIds())lineup.slots[slot]=null;
  saveData();
}

export function removePlayerFromLineup(playerId){
  const lineup=ensureLineup();
  let changed=false;
  for(const slot of slotIds())if(lineup.slots[slot]===playerId){lineup.slots[slot]=null;changed=true;}
  return changed;
}
