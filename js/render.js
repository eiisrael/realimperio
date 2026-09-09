import {state,isAdmin,currentPlayer,escapeHtml,safeImageSrc,formatDate,upcomingEvents} from './state.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const goals=p=>Math.max(0,Number.parseInt(p?.goals,10)||0);

export function emptyState(text='Nada por aqui ainda.'){
  return `<div class="empty-state"><div class="empty-mark">RI</div><h3>${escapeHtml(text)}</h3></div>`;
}

function homeHtml(){
  const d=state.data,approved=d.players.filter(p=>p.status==='approved'),events=upcomingEvents(),scorer=[...approved].sort((a,b)=>goals(b)-goals(a))[0],nextGame=events.find(e=>e.type==='game');
  return `<div class="page-head"><div><span class="kicker">Real Império FC</span><h1>Futebol, união e identidade.</h1><p>O espaço oficial do Real Império FC em Indianópolis, Caruaru-PE.</p></div></div><section class="stats home-stats"><div class="stat-card"><span>Elenco cadastrado</span><strong>${approved.length}</strong></div><div class="stat-card"><span>Próximos eventos</span><strong>${events.length}</strong></div><div class="stat-card"><span>Artilheiro</span><strong>${scorer?escapeHtml(`${scorer.name} · ${goals(scorer)}`):'—'}</strong></div><div class="stat-card"><span>Próximo jogo</span><strong>${nextGame?escapeHtml(formatDate(nextGame.date,{day:'2-digit',month:'2-digit'})):'—'}</strong></div></section><div class="home-feature-grid"><section><div class="section-title"><div><span class="kicker">Atualizações</span><h2>Notícias</h2></div></div><div class="grid">${d.news.length?[...d.news].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(n=>`<article class="card news-card" data-action="open-news" data-id="${n.id}" tabindex="0"><time>${formatDate(n.date,{day:'2-digit',month:'long',year:'numeric'})}</time><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.body).slice(0,180)}${n.body.length>180?'…':''}</p></article>`).join(''):emptyState('Nenhuma notícia publicada.')}</div></section><section><div class="section-title"><div><span class="kicker">Agenda</span><h2>Próximos eventos</h2></div></div><div class="grid">${events.length?events.slice(0,4).map(eventCard).join(''):emptyState('Nenhum evento agendado.')}</div></section></div>`;
}

function eventCard(e){
  return `<article class="card event-card"><div class="event-date"><strong>${formatDate(e.date,{day:'2-digit'})}</strong><span>${formatDate(e.date,{month:'short'}).replace('.','')}</span></div><div><span class="event-type">${e.type==='game'?'Jogo':'Treino'}</span><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml([e.time,e.place].filter(Boolean).join(' · ')||'Horário/local a confirmar')}</p>${e.opponent?`<small>Adversário: ${escapeHtml(e.opponent)}</small>`:''}</div></article>`;
}

function agendaHtml(){
  const events=[...state.data.events].sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const filtered=state.agendaFilter==='all'?events:events.filter(e=>e.type===state.agendaFilter);
  return `<div class="page-head"><div><span class="kicker">Calendário</span><h1>Agenda</h1><p>Acompanhe jogos, treinos e compromissos do Real Império FC.</p></div></div><div class="filter-bar"><button class="filter ${state.agendaFilter==='all'?'active':''}" data-agenda-filter="all">Todos</button><button class="filter ${state.agendaFilter==='game'?'active':''}" data-agenda-filter="game">Jogos</button><button class="filter ${state.agendaFilter==='training'?'active':''}" data-agenda-filter="training">Treinos</button></div><div class="grid">${filtered.length?filtered.map(eventCard).join(''):emptyState('Nenhum compromisso nesse filtro.')}</div>`;
}

function teamHtml(){
  const d=state.data,c=d.coach||{},photo=safeImageSrc(c.photo||'');
  return `<div class="page-head"><div><span class="kicker">Nossa identidade</span><h1>O Time</h1><p>${escapeHtml(d.team.description||'Real Império FC')}</p></div></div><div class="grid grid-2"><article class="card card-accent"><h2>Real Império FC</h2><div class="info-list"><div><span>Bairro</span><strong>${escapeHtml(d.team.neighborhood||'—')}</strong></div><div><span>Cidade</span><strong>${escapeHtml(d.team.city||'—')}</strong></div><div><span>Local de treino</span><strong>${escapeHtml(d.team.trainingPlace||'—')}</strong></div><div><span>Técnico</span><strong>${escapeHtml(c.name||'A definir')}</strong></div></div></article><article class="card coach-public-card"><div class="coach-public-avatar">${photo?`<img src="${escapeHtml(photo)}" alt="Foto do técnico ${escapeHtml(c.name||'')}">`:'<span>TEC</span>'}</div><div><span class="kicker">Comissão Técnica</span><h2>${escapeHtml(c.name||'Técnico a definir')}</h2><p>${escapeHtml(c.bio||'Perfil do técnico ainda não preenchido.')}</p>${c.whatsapp?`<p><strong>Contato:</strong> ${escapeHtml(c.whatsapp)}</p>`:''}</div></article></div>`;
}

function playersHtml(){
  const players=[...state.data.players].filter(p=>p.status==='approved').sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||a.name.localeCompare(b.name));
  return `<div class="page-head"><div><span class="kicker">Elenco</span><h1>Jogadores</h1><p>Conheça os atletas aprovados do Real Império FC.</p></div></div><div class="players-grid">${players.length?players.map(p=>{const photo=safeImageSrc(p.photo||'');return `<article class="card player-card"><div class="player-photo">${photo?`<img src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(p.name)}">`:`<span>${escapeHtml((p.name||'FC').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase())}</span>`}</div><div><span class="player-number">${escapeHtml(p.number||'—')}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.position==='Outro'?'Reserva':p.position||'Jogador')}</p><strong>${goals(p)} gols</strong>${p.bio?`<small>${escapeHtml(p.bio)}</small>`:''}</div></article>`}).join(''):emptyState('Nenhum jogador aprovado ainda.')}</div>`;
}

function registerHtml(){
  return `<div class="auth-wrap"><article class="card auth-card"><span class="kicker">Faça parte do elenco</span><h1>Cadastro de jogador</h1><p class="form-help">Após o envio, seu cadastro ficará pendente até a decisão de um administrador.</p><form id="register-form"><div class="form-grid"><div class="field full"><label>Nome *</label><input name="name" required maxlength="80"></div><div class="field full"><label>E-mail *</label><input name="email" type="email" required></div><div class="field"><label>Posição</label><select name="position"><option value="">Selecione</option><option>Goleiro</option><option>Zagueiro</option><option>Lateral</option><option>Volante</option><option>Meia</option><option>Atacante</option><option>Reserva</option></select></div><div class="field"><label>WhatsApp</label><input name="whatsapp" inputmode="tel"></div><div class="field full"><label>Senha *</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div></div><div class="form-actions"><button class="btn btn-gold">Enviar cadastro</button></div></form></article></div>`;
}

function accountHtml(){
  if(!state.session)return `<div class="auth-wrap"><article class="card auth-card"><span class="kicker">Área de acesso</span><h1>Entrar</h1><form id="login-form"><div class="form-grid"><div class="field full"><label>E-mail</label><input name="email" type="email" required autocomplete="username"></div><div class="field full"><label>Senha</label><input name="password" type="password" required autocomplete="current-password"></div></div><div class="form-actions"><button class="btn btn-gold">Entrar</button></div></form><p class="login-register-hint">Ainda não possui cadastro? <button type="button" data-nav="register">Cadastre-se</button></p></article></div>`;
  if(isAdmin())return `<div class="page-head"><div><span class="kicker">Conta administrativa</span><h1>${escapeHtml(state.session.name||'Administração')}</h1><p>Você está autenticado na administração do Real Império FC.</p></div></div><article class="card"><div class="form-actions"><button class="btn btn-gold" data-nav="admin">Abrir Painel Administrativo</button><button class="btn btn-dark" data-action="logout">Sair</button></div></article>`;
  const p=currentPlayer();
  if(!p)return emptyState('Perfil não encontrado.');
  const photo=safeImageSrc(p.photo||'');
  return `<div class="page-head"><div><span class="kicker">Minha conta</span><h1>${escapeHtml(p.name)}</h1><p>Atualize seus dados pessoais e sua foto.</p></div></div><article class="card account-profile-card"><form id="player-account-form"><div class="account-profile-head"><label class="account-photo-frame" for="player-photo-file" tabindex="0">${photo?`<img class="account-profile-photo" src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(p.name)}">`:`<span class="account-profile-photo account-photo-placeholder">${escapeHtml((p.name||'FC').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase())}</span>`}<span class="account-photo-edit">Alterar foto</span></label><div><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.position||'Jogador')} · ${goals(p)} gols</p><span class="status-badge">${p.status==='approved'?'Aprovado':escapeHtml(p.status)}</span></div></div><input id="player-photo-file" name="photoFile" type="file" accept="image/*" hidden><div class="form-grid"><div class="field full"><label>Nome</label><input name="name" value="${escapeHtml(p.name)}" required></div><div class="field"><label>E-mail</label><input name="email" type="email" value="${escapeHtml(p.email)}" required></div><div class="field"><label>Número</label><input name="number" inputmode="numeric" maxlength="3" value="${escapeHtml(p.number||'')}"></div><div class="field"><label>Posição</label><select name="position"><option value="">Selecione</option>${['Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Reserva'].map(x=>`<option ${((p.position==='Outro'?'Reserva':p.position)||'')===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>WhatsApp</label><input name="whatsapp" inputmode="tel" value="${escapeHtml(p.whatsapp||'')}"></div><div class="field full"><label>Descrição</label><textarea name="bio">${escapeHtml(p.bio||'')}</textarea></div>${photo?`<label class="check-row full"><input type="checkbox" name="removePhoto" value="1"><span>Remover foto atual</span></label>`:''}<div class="field"><label>Nova senha</label><input name="newPassword" type="password" minlength="6" autocomplete="new-password"></div><div class="field"><label>Confirmar nova senha</label><input name="confirmPassword" type="password" minlength="6" autocomplete="new-password"></div></div><div class="form-actions"><button class="btn btn-gold">Salvar configurações</button><button class="btn btn-dark" type="button" data-action="logout">Sair</button></div></form></article>`;
}

export function renderPublic(){
  const map={home:homeHtml,agenda:agendaHtml,team:teamHtml,players:playersHtml,register:registerHtml,account:accountHtml};
  for(const [id,fn] of Object.entries(map)){const el=$(`#view-${id}`);if(el)el.innerHTML=fn()}
  renderHeader();
}

export function renderHeader(){
  $('#account-btn').textContent=state.session?'Minha conta':'Entrar';
  $('#admin-btn').classList.toggle('hidden',!isAdmin());
}

export function showView(view,update=true){
  if(view==='admin'&&!isAdmin())view='account';
  state.currentView=view;
  $$('.view').forEach(el=>el.classList.toggle('active-view',el.id===`view-${view}`));
  $$('.nav-item,.mobile-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
  if(update){
    const url=new URL(window.location.href);
    url.hash=view;
    history.replaceState(null,'',url);
    scrollTo({top:0,behavior:'smooth'});
  }
}