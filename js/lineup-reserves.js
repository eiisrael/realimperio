import {state,escapeHtml,safeImageSrc} from './state.js';

const LINEUP_SLOTS=['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','gk'];
const LEGACY_SLOTS=['lw','st','rw','lcm','cm','rcm','lb','lcb','rcb','rb'];
const goals=player=>Math.max(0,Number.parseInt(player?.goals,10)||0);
const initials=name=>String(name||'').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase()||'FC';

function starterIds(){
  const slots=state.data?.lineup?.slots||{};
  const ids=new Set();
  [...LINEUP_SLOTS,...LEGACY_SLOTS].forEach(slot=>{
    const id=slots[slot];
    if(id!==null&&id!==undefined&&id!=='')ids.add(String(id));
  });
  return ids;
}

function reservePlayers(){
  const starters=starterIds();
  return [...(state.data?.players||[])]
    .filter(player=>player?.status==='approved'&&!starters.has(String(player.id)))
    .sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
}

function avatarHtml(player){
  const src=safeImageSrc(player?.photo||'');
  return src
    ? `<img src="${escapeHtml(src)}" alt="Foto de ${escapeHtml(player.name||'Jogador')}">`
    : `<span class="lineup-initials">${escapeHtml(initials(player?.name))}</span>`;
}

function tooltipHtml(player){
  const src=safeImageSrc(player?.photo||'');
  const position=String(player?.position||'Jogador');
  return `<span class="lineup-tooltip lineup-reserve-tooltip"><span class="lineup-tooltip-head"><span class="lineup-tooltip-avatar">${src?`<img src="${escapeHtml(src)}" alt="">`:escapeHtml(initials(player?.name))}</span><span><strong>${escapeHtml(player?.name||'Jogador')}</strong><span class="position">Reserva · ${escapeHtml(position)}</span></span></span><span class="lineup-tooltip-grid"><span class="lineup-tooltip-stat"><span>Camisa</span><strong>${escapeHtml(player?.number||'—')}</strong></span><span class="lineup-tooltip-stat"><span>Gols</span><strong>⚽ ${goals(player)}</strong></span><span class="lineup-tooltip-stat"><span>Posição</span><strong>${escapeHtml(position)}</strong></span><span class="lineup-tooltip-stat"><span>Status</span><strong>Reserva</strong></span></span><p class="lineup-tooltip-bio">${escapeHtml(player?.bio||'Descrição do jogador ainda não adicionada.')}</p></span>`;
}

function reserveNodeHtml(player){
  const firstName=String(player?.name||'Jogador').trim().split(/\s+/)[0]||'Jogador';
  const position=String(player?.position||'Jogador');
  return `<span class="lineup-reserve-node"><button type="button" class="lineup-player lineup-reserve-player" aria-label="${escapeHtml(`${player?.name||'Jogador'} — reserva, ${position}`)}">${avatarHtml(player)}</button>${tooltipHtml(player)}<span class="lineup-name">${escapeHtml(firstName)}</span></span>`;
}

function panelHtml(players,signature){
  return `<aside class="lineup-reserves-panel" aria-label="Jogadores reservas" data-reserve-signature="${escapeHtml(signature)}"><div class="lineup-reserves-head"><div><span class="lineup-reserves-kicker">Banco</span><strong>RESERVAS</strong></div><span class="lineup-reserves-count">${players.length}</span></div>${players.length?`<div class="lineup-reserves-grid">${players.map(reserveNodeHtml).join('')}</div>`:`<div class="lineup-reserves-empty"><span>RI</span><p>Nenhum reserva disponível no elenco.</p></div>`}</aside>`;
}

function reserveSignature(players){
  return JSON.stringify(players.map(player=>[
    player.id,
    player.name,
    player.photo,
    player.number,
    player.position,
    player.goals,
    player.bio,
    player.status
  ]));
}

function enhancePublicLineup(){
  const view=document.querySelector('#view-lineup');
  if(!view)return;
  const stage=view.querySelector('.lineup-pitch-stage');
  if(!stage)return;

  let layout=stage.querySelector(':scope > .lineup-field-layout');
  let pitch=layout?.querySelector(':scope > .lineup-pitch')||stage.querySelector(':scope > .lineup-pitch');
  if(!pitch)return;

  if(!layout){
    layout=document.createElement('div');
    layout.className='lineup-field-layout';
    stage.insertBefore(layout,pitch);
    layout.appendChild(pitch);
  }

  const players=reservePlayers();
  const signature=reserveSignature(players);
  const currentPanel=layout.querySelector(':scope > .lineup-reserves-panel');
  if(currentPanel?.dataset.reserveSignature===signature)return;

  const template=document.createElement('template');
  template.innerHTML=panelHtml(players,signature).trim();
  const panel=template.content.firstElementChild;
  if(!panel)return;

  currentPanel?currentPanel.replaceWith(panel):layout.appendChild(panel);
}

let queued=false;
function scheduleEnhancement(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    enhancePublicLineup();
  });
}

const view=document.querySelector('#view-lineup');
if(view){
  const observer=new MutationObserver(scheduleEnhancement);
  observer.observe(view,{childList:true,subtree:true});
}

scheduleEnhancement();
