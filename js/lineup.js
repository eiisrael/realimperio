import {state,saveData,isAdmin,escapeHtml,safeImageSrc,logAction} from './state.js';

const GENERIC_SLOTS=['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','gk'];
const LEGACY_SLOT_MAP={lw:'p1',st:'p2',rw:'p3',lcm:'p4',cm:'p5',rcm:'p6',lb:'p7',lcb:'p8',rcb:'p9',rb:'p10',gk:'gk'};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const P=(slot,label,short,x,y)=>({slot,label,short,x,y});

export const FORMATION_PRESETS={
  '4-3-3':{label:'4-3-3',positions:[P('p1','Ponta Esquerda','PE',18,14),P('p2','Centroavante','CA',50,10),P('p3','Ponta Direita','PD',82,14),P('p4','Meia Esquerda','ME',28,37),P('p5','Meia Central','MC',50,34),P('p6','Meia Direita','MD',72,37),P('p7','Lateral Esquerdo','LE',15,65),P('p8','Zagueiro Esquerdo','ZE',38,61),P('p9','Zagueiro Direito','ZD',62,61),P('p10','Lateral Direito','LD',85,65),P('gk','Goleiro','GOL',50,87)]},
  '4-4-2':{label:'4-4-2',positions:[P('p1','Atacante Esquerdo','ATA',37,13),P('p2','Atacante Direito','ATA',63,13),P('p3','Meia Esquerda','ME',15,38),P('p4','Meia Central Esquerdo','MC',39,39),P('p5','Meia Central Direito','MC',61,39),P('p6','Meia Direita','MD',85,38),P('p7','Lateral Esquerdo','LE',15,66),P('p8','Zagueiro Esquerdo','ZE',38,62),P('p9','Zagueiro Direito','ZD',62,62),P('p10','Lateral Direito','LD',85,66),P('gk','Goleiro','GOL',50,87)]},
  '4-2-3-1':{label:'4-2-3-1',positions:[P('p1','Ponta Esquerda','PE',20,29),P('p2','Centroavante','CA',50,10),P('p3','Ponta Direita','PD',80,29),P('p4','Meia Ofensivo','MO',50,27),P('p5','Volante Esquerdo','VOL',38,48),P('p6','Volante Direito','VOL',62,48),P('p7','Lateral Esquerdo','LE',15,68),P('p8','Zagueiro Esquerdo','ZE',38,64),P('p9','Zagueiro Direito','ZD',62,64),P('p10','Lateral Direito','LD',85,68),P('gk','Goleiro','GOL',50,88)]},
  '4-1-4-1':{label:'4-1-4-1',positions:[P('p1','Meia Esquerda','ME',15,34),P('p2','Centroavante','CA',50,10),P('p3','Meia Direita','MD',85,34),P('p4','Meia Central Esquerdo','MC',38,35),P('p5','Volante','VOL',50,52),P('p6','Meia Central Direito','MC',62,35),P('p7','Lateral Esquerdo','LE',15,69),P('p8','Zagueiro Esquerdo','ZE',38,65),P('p9','Zagueiro Direito','ZD',62,65),P('p10','Lateral Direito','LD',85,69),P('gk','Goleiro','GOL',50,88)]},
  '4-1-2-1-2':{label:'4-1-2-1-2 (Losango)',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Meia Ofensivo','MO',50,29),P('p4','Meia Central Esquerdo','MC',31,43),P('p5','Volante','VOL',50,56),P('p6','Meia Central Direito','MC',69,43),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-3-1-2':{label:'4-3-1-2',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Meia Ofensivo','MO',50,29),P('p4','Meia Esquerdo','MC',25,45),P('p5','Meia Central','MC',50,46),P('p6','Meia Direito','MC',75,45),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-3-2-1':{label:'4-3-2-1 (Árvore de Natal)',positions:[P('p1','Meia Ofensivo Esquerdo','MO',32,28),P('p2','Centroavante','CA',50,10),P('p3','Meia Ofensivo Direito','MO',68,28),P('p4','Meia Esquerdo','MC',25,45),P('p5','Meia Central','MC',50,46),P('p6','Meia Direito','MC',75,45),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-2-2-2':{label:'4-2-2-2',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Meia Ofensivo Esquerdo','MO',28,32),P('p4','Meia Ofensivo Direito','MO',72,32),P('p5','Volante Esquerdo','VOL',38,50),P('p6','Volante Direito','VOL',62,50),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-1-3-2':{label:'4-1-3-2',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Meia Esquerdo','MEI',25,36),P('p4','Meia Central','MEI',50,34),P('p5','Volante','VOL',50,53),P('p6','Meia Direito','MEI',75,36),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-2-1-3':{label:'4-2-1-3',positions:[P('p1','Ponta Esquerda','PE',18,14),P('p2','Centroavante','CA',50,10),P('p3','Ponta Direita','PD',82,14),P('p4','Meia Ofensivo','MO',50,34),P('p5','Volante Esquerdo','VOL',38,51),P('p6','Volante Direito','VOL',62,51),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-5-1':{label:'4-5-1',positions:[P('p1','Meia Esquerda','ME',13,39),P('p2','Centroavante','CA',50,10),P('p3','Meia Direita','MD',87,39),P('p4','Meia Central Esquerdo','MC',32,42),P('p5','Meia Central','MC',50,37),P('p6','Meia Central Direito','MC',68,42),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-2-4':{label:'4-2-4',positions:[P('p1','Ponta Esquerda','PE',13,16),P('p2','Atacante Esquerdo','ATA',38,12),P('p3','Atacante Direito','ATA',62,12),P('p4','Ponta Direita','PD',87,16),P('p5','Meia Central Esquerdo','MC',38,47),P('p6','Meia Central Direito','MC',62,47),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '4-6-0':{label:'4-6-0',positions:[P('p1','Meia Ofensivo Esquerdo','MO',20,27),P('p2','Falso 9','F9',50,23),P('p3','Meia Ofensivo Direito','MO',80,27),P('p4','Meia Esquerdo','MC',22,46),P('p5','Meia Central','MC',50,43),P('p6','Meia Direito','MC',78,46),P('p7','Lateral Esquerdo','LE',15,70),P('p8','Zagueiro Esquerdo','ZE',38,66),P('p9','Zagueiro Direito','ZD',62,66),P('p10','Lateral Direito','LD',85,70),P('gk','Goleiro','GOL',50,89)]},
  '3-5-2':{label:'3-5-2',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Ala Esquerdo','AE',12,40),P('p4','Meia Esquerdo','MC',33,42),P('p5','Meia Central','MC',50,38),P('p6','Meia Direito','MC',67,42),P('p7','Ala Direito','AD',88,40),P('p8','Zagueiro Esquerdo','ZE',25,68),P('p9','Zagueiro Central','ZC',50,65),P('p10','Zagueiro Direito','ZD',75,68),P('gk','Goleiro','GOL',50,89)]},
  '3-4-3':{label:'3-4-3',positions:[P('p1','Ponta Esquerda','PE',18,14),P('p2','Centroavante','CA',50,10),P('p3','Ponta Direita','PD',82,14),P('p4','Meia Esquerda','ME',17,41),P('p5','Meia Central Esquerdo','MC',39,43),P('p6','Meia Central Direito','MC',61,43),P('p7','Meia Direita','MD',83,41),P('p8','Zagueiro Esquerdo','ZE',25,68),P('p9','Zagueiro Central','ZC',50,65),P('p10','Zagueiro Direito','ZD',75,68),P('gk','Goleiro','GOL',50,89)]},
  '3-4-2-1':{label:'3-4-2-1',positions:[P('p1','Meia Ofensivo Esquerdo','MO',32,28),P('p2','Centroavante','CA',50,10),P('p3','Meia Ofensivo Direito','MO',68,28),P('p4','Ala Esquerdo','AE',15,46),P('p5','Meia Central Esquerdo','MC',39,46),P('p6','Meia Central Direito','MC',61,46),P('p7','Ala Direito','AD',85,46),P('p8','Zagueiro Esquerdo','ZE',25,69),P('p9','Zagueiro Central','ZC',50,66),P('p10','Zagueiro Direito','ZD',75,69),P('gk','Goleiro','GOL',50,89)]},
  '3-1-4-2':{label:'3-1-4-2',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Meia Esquerda','ME',15,38),P('p4','Meia Central Esquerdo','MC',38,39),P('p5','Volante','VOL',50,54),P('p6','Meia Central Direito','MC',62,39),P('p7','Meia Direita','MD',85,38),P('p8','Zagueiro Esquerdo','ZE',25,70),P('p9','Zagueiro Central','ZC',50,67),P('p10','Zagueiro Direito','ZD',75,70),P('gk','Goleiro','GOL',50,90)]},
  '3-2-4-1':{label:'3-2-4-1',positions:[P('p1','Meia Ofensivo Esquerdo','MO',15,31),P('p2','Centroavante','CA',50,10),P('p3','Meia Ofensivo Direito','MO',85,31),P('p4','Meia Interior Esquerdo','MEI',37,34),P('p5','Volante Esquerdo','VOL',38,53),P('p6','Volante Direito','VOL',62,53),P('p7','Meia Interior Direito','MEI',63,34),P('p8','Zagueiro Esquerdo','ZE',25,71),P('p9','Zagueiro Central','ZC',50,68),P('p10','Zagueiro Direito','ZD',75,71),P('gk','Goleiro','GOL',50,90)]},
  '3-6-1':{label:'3-6-1',positions:[P('p1','Meia Ofensivo Esquerdo','MO',20,29),P('p2','Centroavante','CA',50,10),P('p3','Meia Ofensivo Direito','MO',80,29),P('p4','Meia Esquerdo','MC',20,49),P('p5','Meia Central','MC',50,45),P('p6','Meia Direito','MC',80,49),P('p7','Meia Ofensivo Central','MO',50,27),P('p8','Zagueiro Esquerdo','ZE',25,71),P('p9','Zagueiro Central','ZC',50,68),P('p10','Zagueiro Direito','ZD',75,71),P('gk','Goleiro','GOL',50,90)]},
  '3-3-4':{label:'3-3-4',positions:[P('p1','Ponta Esquerda','PE',12,16),P('p2','Atacante Esquerdo','ATA',38,12),P('p3','Atacante Direito','ATA',62,12),P('p4','Ponta Direita','PD',88,16),P('p5','Meia Esquerdo','MC',25,45),P('p6','Meia Central','MC',50,42),P('p7','Meia Direito','MC',75,45),P('p8','Zagueiro Esquerdo','ZE',25,70),P('p9','Zagueiro Central','ZC',50,67),P('p10','Zagueiro Direito','ZD',75,70),P('gk','Goleiro','GOL',50,90)]},
  '5-3-2':{label:'5-3-2',positions:[P('p1','Atacante Esquerdo','ATA',35,12),P('p2','Atacante Direito','ATA',65,12),P('p3','Meia Esquerdo','MC',25,42),P('p4','Meia Central','MC',50,39),P('p5','Meia Direito','MC',75,42),P('p6','Ala Esquerdo','AE',10,68),P('p7','Zagueiro Esquerdo','ZE',30,66),P('p8','Zagueiro Central','ZC',50,64),P('p9','Zagueiro Direito','ZD',70,66),P('p10','Ala Direito','AD',90,68),P('gk','Goleiro','GOL',50,90)]},
  '5-4-1':{label:'5-4-1',positions:[P('p1','Meia Esquerda','ME',15,39),P('p2','Centroavante','CA',50,10),P('p3','Meia Direita','MD',85,39),P('p4','Meia Central Esquerdo','MC',39,41),P('p5','Meia Central Direito','MC',61,41),P('p6','Ala Esquerdo','AE',10,68),P('p7','Zagueiro Esquerdo','ZE',30,66),P('p8','Zagueiro Central','ZC',50,64),P('p9','Zagueiro Direito','ZD',70,66),P('p10','Ala Direito','AD',90,68),P('gk','Goleiro','GOL',50,90)]},
  '5-2-3':{label:'5-2-3',positions:[P('p1','Ponta Esquerda','PE',18,14),P('p2','Centroavante','CA',50,10),P('p3','Ponta Direita','PD',82,14),P('p4','Meia Central Esquerdo','MC',38,44),P('p5','Meia Central Direito','MC',62,44),P('p6','Ala Esquerdo','AE',10,68),P('p7','Zagueiro Esquerdo','ZE',30,66),P('p8','Zagueiro Central','ZC',50,64),P('p9','Zagueiro Direito','ZD',70,66),P('p10','Ala Direito','AD',90,68),P('gk','Goleiro','GOL',50,90)]}
};

const formationKeys=()=>Object.keys(FORMATION_PRESETS);
const slotIds=()=>GENERIC_SLOTS;
const goals=p=>Math.max(0,Number.parseInt(p?.goals,10)||0);
const initials=name=>String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'FC';

function baseFormationKey(lineup){return FORMATION_PRESETS[lineup.baseFormation]?lineup.baseFormation:(FORMATION_PRESETS[lineup.formation]?lineup.formation:'4-3-3')}
function presetPositions(key){return FORMATION_PRESETS[key]?.positions||FORMATION_PRESETS['4-3-3'].positions}
function formationLabel(lineup=ensureLineup()){
  if(lineup.formation==='custom')return 'Livre / Personalizada';
  const label=FORMATION_PRESETS[lineup.formation]?.label||lineup.formation||'4-3-3';
  return lineup.customized?`${label} · Ajustada`:label;
}

export function ensureLineup(){
  if(!state.data.lineup||typeof state.data.lineup!=='object')state.data.lineup={formation:'4-3-3',baseFormation:'4-3-3',customized:false,slots:{},coordinates:{}};
  const lineup=state.data.lineup;
  if(!lineup.slots||typeof lineup.slots!=='object')lineup.slots={};

  const hasGeneric=GENERIC_SLOTS.some(k=>lineup.slots[k]);
  const hasLegacy=Object.keys(LEGACY_SLOT_MAP).some(k=>lineup.slots[k]);
  if(!hasGeneric&&hasLegacy){
    for(const [legacy,generic] of Object.entries(LEGACY_SLOT_MAP))if(lineup.slots[legacy])lineup.slots[generic]=lineup.slots[legacy];
  }
  for(const slot of GENERIC_SLOTS)if(!(slot in lineup.slots))lineup.slots[slot]=null;

  if(!lineup.formation)lineup.formation='4-3-3';
  if(lineup.formation!=='custom'&&!FORMATION_PRESETS[lineup.formation])lineup.formation='4-3-3';
  if(!FORMATION_PRESETS[lineup.baseFormation])lineup.baseFormation=lineup.formation==='custom'?'4-3-3':lineup.formation;
  lineup.customized=Boolean(lineup.customized||lineup.formation==='custom');
  if(!lineup.coordinates||typeof lineup.coordinates!=='object')lineup.coordinates={};

  const base=presetPositions(baseFormationKey(lineup));
  for(const pos of base){
    const saved=lineup.coordinates[pos.slot];
    if(!saved||!Number.isFinite(Number(saved.x))||!Number.isFinite(Number(saved.y)))lineup.coordinates[pos.slot]={x:pos.x,y:pos.y};
    else lineup.coordinates[pos.slot]={x:clamp(Number(saved.x),4,96),y:clamp(Number(saved.y),4,96)};
  }
  return lineup;
}

function activePositions(){
  const lineup=ensureLineup(),base=presetPositions(baseFormationKey(lineup));
  return base.map(pos=>({...pos,...(lineup.coordinates[pos.slot]||{})}));
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
  const dragAttr=admin&&player?`data-lineup-drag-slot="${pos.slot}"`:'';
  const button=`<button type="button" class="lineup-player ${player?'':'is-empty'}" ${admin?`data-action="lineup-assign-slot" data-slot="${pos.slot}"`:''} ${dragAttr} aria-label="${escapeHtml(player?`${player.name} — ${pos.label}`:`${pos.label} — posição disponível`)}">${player?avatarHtml(player):`<span class="lineup-empty-abbr">${escapeHtml(pos.short)}</span>`}</button>`;
  return `<span class="lineup-player-node ${admin?'lineup-admin-node':''}" data-lineup-node-slot="${pos.slot}" style="--x:${pos.x}%;--y:${pos.y}%">${button}${tooltipHtml(pos,player)}<span class="lineup-name">${escapeHtml(name)}</span>${admin&&player?`<button type="button" class="lineup-clear-node" data-action="lineup-clear-slot" data-slot="${pos.slot}" aria-label="Retirar ${escapeHtml(player.name)} desta posição">×</button>`:''}</span>`;
}

function pitchHtml({admin=false}={}){
  const lineup=ensureLineup(),positions=activePositions();
  return `<div class="lineup-pitch-stage"><div class="lineup-pitch ${admin?'lineup-pitch-admin':''}" ${admin?'data-lineup-admin-pitch="true"':''} aria-label="Campo com escalação em formação ${escapeHtml(formationLabel(lineup))}"><span class="pitch-center-dot"></span><span class="pitch-box top"></span><span class="pitch-box bottom"></span><span class="pitch-goal-box top"></span><span class="pitch-goal-box bottom"></span><span class="pitch-goal top"></span><span class="pitch-goal bottom"></span><span class="pitch-arc top"></span><span class="pitch-arc bottom"></span>${positions.map(p=>nodeHtml(p,{admin})).join('')}</div></div>`;
}

function formationOptions(){
  return `${formationKeys().map(key=>`<option value="${key}">${escapeHtml(FORMATION_PRESETS[key].label)}</option>`).join('')}<option value="custom">Livre / Personalizada</option>`;
}

export function publicLineupHtml(){
  const lineup=ensureLineup(),count=GENERIC_SLOTS.filter(s=>assignedPlayer(s)).length;
  return `<div class="page-head lineup-page-head"><div><span class="kicker">Time titular</span><h1>Escalação</h1><p>Conheça a formação titular do Real Império FC. Passe o mouse sobre um atleta — ou toque no celular — para ver nome, posição, camisa, saldo de gols e informações.</p></div><span class="lineup-formation-chip">⚽ ${escapeHtml(formationLabel(lineup))}</span></div><section class="lineup-section" id="public-lineup"><div class="lineup-shell"><div class="lineup-topbar"><div><strong>REAL IMPÉRIO FC · TITULARES</strong><span>${count}/11 posições definidas pela administração</span></div><span>Indianópolis · Caruaru-PE</span></div>${pitchHtml()}</div></section>`;
}

export function renderLineupPublic(){
  const view=document.querySelector('#view-lineup');
  if(!view)return;
  view.innerHTML=publicLineupHtml();
}

function setFormation(key){
  const lineup=ensureLineup();
  if(key==='custom'){
    lineup.formation='custom';
    lineup.customized=true;
    saveData();
    return;
  }
  if(!FORMATION_PRESETS[key])return;
  lineup.formation=key;
  lineup.baseFormation=key;
  lineup.customized=false;
  lineup.coordinates={};
  for(const pos of presetPositions(key))lineup.coordinates[pos.slot]={x:pos.x,y:pos.y};
  saveData();
}

function resetFormationPositions(){
  const lineup=ensureLineup(),key=baseFormationKey(lineup);
  lineup.formation=key;
  lineup.baseFormation=key;
  lineup.customized=false;
  lineup.coordinates={};
  for(const pos of presetPositions(key))lineup.coordinates[pos.slot]={x:pos.x,y:pos.y};
  saveData();
}

function setSlotPosition(slot,x,y){
  if(!GENERIC_SLOTS.includes(slot))return;
  const lineup=ensureLineup();
  lineup.coordinates[slot]={x:clamp(Number(x),4,96),y:clamp(Number(y),4,96)};
  lineup.customized=true;
  saveData();
}

function bindAdminControls(panel){
  const formationSelect=panel.querySelector('#lineup-formation-select');
  if(formationSelect){
    formationSelect.value=ensureLineup().formation;
    formationSelect.addEventListener('change',()=>{
      setFormation(formationSelect.value);
      logAction(`Formação alterada para ${formationLabel()}`);
      renderLineupPublic();
      renderLineupAdmin();
    });
  }
  const playerSelect=panel.querySelector('#lineup-player-select');
  if(playerSelect)playerSelect.addEventListener('change',()=>{state.lineupSelectedPlayerId=playerSelect.value});
  panel.querySelector('[data-lineup-reset-positions]')?.addEventListener('click',()=>{
    resetFormationPositions();
    logAction(`Posições restauradas para ${formationLabel()}`);
    renderLineupPublic();
    renderLineupAdmin();
  });

  const pitch=panel.querySelector('[data-lineup-admin-pitch]');
  if(!pitch)return;
  pitch.querySelectorAll('[data-lineup-drag-slot]').forEach(button=>{
    button.addEventListener('pointerdown',ev=>{
      if(ev.pointerType==='mouse'&&ev.button!==0)return;
      const slot=button.dataset.lineupDragSlot,node=button.closest('[data-lineup-node-slot]');
      if(!slot||!node)return;
      const rect=pitch.getBoundingClientRect(),startX=ev.clientX,startY=ev.clientY;
      let moved=false,lastX=parseFloat(getComputedStyle(node).getPropertyValue('--x'))||50,lastY=parseFloat(getComputedStyle(node).getPropertyValue('--y'))||50;
      button.setPointerCapture?.(ev.pointerId);
      node.classList.add('is-drag-ready');

      const onMove=e=>{
        const distance=Math.hypot(e.clientX-startX,e.clientY-startY);
        if(!moved&&distance<4)return;
        moved=true;
        lastX=clamp(((e.clientX-rect.left)/rect.width)*100,4,96);
        lastY=clamp(((e.clientY-rect.top)/rect.height)*100,4,96);
        node.style.setProperty('--x',`${lastX}%`);
        node.style.setProperty('--y',`${lastY}%`);
        node.classList.add('is-dragging');
        e.preventDefault();
      };
      const finish=()=>{
        button.removeEventListener('pointermove',onMove);
        button.removeEventListener('pointerup',finish);
        button.removeEventListener('pointercancel',finish);
        node.classList.remove('is-drag-ready','is-dragging');
        if(moved){
          button.dataset.dragged='1';
          setSlotPosition(slot,lastX,lastY);
          const player=assignedPlayer(slot);
          if(player)logAction(`Posição manual ajustada: ${player.name}`);
          renderLineupPublic();
          panel.querySelectorAll('.lineup-formation-chip').forEach(el=>{el.textContent=formationLabel()});
        }
      };
      button.addEventListener('pointermove',onMove);
      button.addEventListener('pointerup',finish,{once:true});
      button.addEventListener('pointercancel',finish,{once:true});
      ev.preventDefault();
    });
  });
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
  const lineup=ensureLineup(),players=approvedPlayers();
  if(!players.some(p=>p.id===state.lineupSelectedPlayerId))state.lineupSelectedPlayerId='';
  panel.innerHTML=`<div class="admin-toolbar"><div><h2>Escalação</h2><p class="form-help">Escolha uma formação pronta ou use o modo livre. Depois, arraste qualquer jogador diretamente pelo campo para ajustar a posição exatamente como desejar.</p></div></div><article class="card card-accent"><div class="lineup-admin-controls"><div class="lineup-admin-select"><label for="lineup-formation-select">Formato da escalação</label><select id="lineup-formation-select">${formationOptions()}</select><p class="lineup-admin-help">Incluímos as principais formações do futebol de 11. O modo <strong>Livre / Personalizada</strong> permite criar qualquer outra variação.</p></div><div class="lineup-admin-select"><label for="lineup-player-select">Jogador para posicionar</label><select id="lineup-player-select"><option value="">Selecione um jogador...</option>${players.map(p=>`<option value="${p.id}" ${state.lineupSelectedPlayerId===p.id?'selected':''}>${escapeHtml(p.number?`${p.number} · ${p.name}`:p.name)} — ${escapeHtml(p.position||'Jogador')}</option>`).join('')}</select><p class="lineup-admin-help">Para inserir ou trocar um jogador, selecione-o e clique em uma posição. Para mover livremente quem já está no campo, clique, segure e arraste.</p></div></div><div class="lineup-admin-actions"><button type="button" class="btn btn-dark btn-sm" data-lineup-reset-positions>Restaurar posições da formação</button><button type="button" class="btn btn-danger btn-sm" data-action="lineup-clear-all">Limpar escalação</button></div><div class="lineup-shell"><div class="lineup-topbar"><div><strong>EDITOR VISUAL DA ESCALAÇÃO</strong><span>Clique para escalar · arraste para mover livremente</span></div><span class="lineup-formation-chip">${escapeHtml(formationLabel(lineup))}</span></div>${pitchHtml({admin:true})}<div class="lineup-admin-legend"><span><strong>Arrastar:</strong> segure um atleta e mova para qualquer ponto do campo.</span><span>${GENERIC_SLOTS.filter(s=>assignedPlayer(s)).length}/11 titulares definidos</span></div></div></article>`;
  bindAdminControls(panel);
}

export function assignLineupPlayer(slot,playerId){
  if(!GENERIC_SLOTS.includes(slot))return {ok:false,message:'Posição inválida.'};
  const player=state.data.players.find(p=>p.id===playerId&&p.status==='approved');
  if(!player)return {ok:false,message:'Selecione um jogador aprovado antes de clicar no campo.'};
  const lineup=ensureLineup();
  for(const key of GENERIC_SLOTS)if(lineup.slots[key]===player.id)lineup.slots[key]=null;
  lineup.slots[slot]=player.id;
  saveData();
  return {ok:true,player};
}

export function clearLineupSlot(slot){
  if(!GENERIC_SLOTS.includes(slot))return false;
  ensureLineup().slots[slot]=null;
  saveData();
  return true;
}

export function clearLineupAll(){
  const lineup=ensureLineup();
  for(const slot of GENERIC_SLOTS)lineup.slots[slot]=null;
  saveData();
}

export function removePlayerFromLineup(playerId){
  const lineup=ensureLineup();
  let changed=false;
  for(const slot of GENERIC_SLOTS)if(lineup.slots[slot]===playerId){lineup.slots[slot]=null;changed=true;}
  return changed;
}
