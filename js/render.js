import {state,isAdmin,currentPlayer,escapeHtml,safeImageSrc,formatDate,parseDate,upcomingEvents} from './state.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const playerGoals=p=>Math.max(0,Number.parseInt(p?.goals,10)||0);
const initials=name=>String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'RI';
const monthShort=s=>formatDate(s,{month:'short'}).replace('.','').toUpperCase();

export const emptyState=(t='Assim que houver novidades, elas aparecerão nesta área.')=>`<div class="empty-state"><div class="empty-mark">RI</div><h3>Nada por aqui ainda</h3><p>${escapeHtml(t)}</p></div>`;

function positionOptions(current=''){
  const options=['Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Outro'];
  const extra=current&&!options.includes(current)?`<option selected>${escapeHtml(current)}</option>`:'';
  return `<option value="">Selecione</option>${extra}${options.map(x=>`<option ${current===x?'selected':''}>${x}</option>`).join('')}`;
}

export function eventCard(e,{compact=false}={}){
  const d=e.date?String(parseDate(e.date).getDate()).padStart(2,'0'):'--',game=e.type==='game';
  return `<article class="card event-card ${compact?'event-card-compact':''}"><div class="date-chip"><strong>${d}</strong><span>${monthShort(e.date)}</span></div><div class="event-meta"><span class="badge ${game?'badge-game':'badge-training'}">${game?'Jogo':'Treino'}</span><h3>${escapeHtml(e.title||'Compromisso')}</h3>${game&&e.opponent?`<p><strong>Adversário:</strong> ${escapeHtml(e.opponent)}</p>`:''}<p><strong>Horário:</strong> ${escapeHtml(e.time||'A confirmar')}</p><p><strong>Local:</strong> ${escapeHtml(e.place||'A confirmar')}</p>${!compact&&e.notes?`<p>${escapeHtml(e.notes)}</p>`:''}</div></article>`;
}

function playerCard(p){
  const photo=safeImageSrc(p.photo),goals=playerGoals(p);
  return `<div class="player-card-wrap">${p.number?`<div class="player-number">${escapeHtml(p.number)}</div>`:''}<article class="card player-card">${photo?`<img class="player-photo" src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(p.name)}">`:`<div class="player-placeholder"><span>${escapeHtml(initials(p.name))}</span></div>`}<div class="player-body"><h3>${escapeHtml(p.name)}</h3><div class="player-meta-row"><span class="player-position">${escapeHtml(p.position||'Jogador')}</span><span class="badge badge-training">Gols: ${goals}</span></div><p class="player-bio">${escapeHtml(p.bio||'Descrição do jogador ainda não adicionada.')}</p></div></article></div>`;
}

function homeNewsCard(n){
  const preview=String(n.body||'').trim();
  return `<button type="button" class="card news-card news-card-button" data-action="open-news" data-id="${n.id}"><time>${formatDate(n.date,{day:'2-digit',month:'long',year:'numeric'})}</time><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(preview.length>150?preview.slice(0,147)+'...':preview)}</p><span class="news-read-more">Ler notícia</span></button>`;
}

function homeSummary(approved,next,game){
  const scorer=[...approved].sort((a,b)=>playerGoals(b)-playerGoals(a)||a.name.localeCompare(b.name))[0];
  return `<div class="stats home-summary"><div class="stat-card"><span>Elenco cadastrado</span><strong>${approved.length}</strong></div><div class="stat-card"><span>Próximos eventos</span><strong>${next.length}</strong></div><div class="stat-card"><span>Artilheiro</span><strong class="stat-name">${scorer?`${escapeHtml(scorer.name.split(' ')[0])} · ${playerGoals(scorer)} gols`:'—'}</strong></div><div class="stat-card"><span>Próximo jogo</span><strong>${game?formatDate(game.date,{day:'2-digit',month:'2-digit'}):'—'}</strong></div></div>`;
}

export function renderPublic(){
  const d=state.data, approved=d.players.filter(p=>p.status==='approved'), next=upcomingEvents(), game=next.find(e=>e.type==='game');
  const recentNews=[...d.news].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);

  $('#view-home').innerHTML=`${homeSummary(approved,next,game)}
  <section class="hero"><div class="hero-copy"><span class="kicker">Indianópolis · Caruaru-PE</span><h1>Real Império<br>FC</h1><p>Agenda, elenco, notícias e informações oficiais do time reunidos em um aplicativo feito para a torcida e para os jogadores.</p><div class="hero-actions"><button class="btn btn-red" data-nav="agenda">Ver próximos jogos</button><button class="btn btn-gold" data-nav="register">Quero me cadastrar</button></div></div><div class="hero-logo-wrap"><img class="hero-logo" src="assets/logo-real-imperio.svg" alt="Real Império FC"></div></section>
  <section class="home-columns"><div class="home-column"><div class="section-title"><div><h2>Notícias do Império</h2><p>Clique em uma notícia para abrir os detalhes.</p></div></div><div class="home-news-list">${recentNews.length?recentNews.map(homeNewsCard).join(''):emptyState('Ainda não existem notícias publicadas.')}</div></div><div class="home-column"><div class="section-title"><div><h2>Próximos compromissos</h2><p>Jogos e treinos marcados pela administração.</p></div><button class="btn btn-ghost btn-sm" data-nav="agenda">Agenda completa</button></div><div class="home-events-list">${next.length?next.slice(0,4).map(e=>eventCard(e,{compact:true})).join(''):emptyState('Nenhum jogo ou treino futuro foi marcado.')}</div></div></section>`;

  const ev=[...d.events].sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), filtered=state.agendaFilter==='all'?ev:ev.filter(e=>e.type===state.agendaFilter);
  $('#view-agenda').innerHTML=`<div class="page-head"><div><span class="kicker">Calendário oficial</span><h1>Jogos & Treinos</h1><p>Acompanhe os compromissos do Real Império FC.</p></div></div><div class="filters"><button class="filter-btn ${state.agendaFilter==='all'?'active':''}" data-agenda-filter="all">Todos</button><button class="filter-btn ${state.agendaFilter==='game'?'active':''}" data-agenda-filter="game">Jogos</button><button class="filter-btn ${state.agendaFilter==='training'?'active':''}" data-agenda-filter="training">Treinos</button></div><div class="grid grid-2">${filtered.length?filtered.map(eventCard).join(''):emptyState('Nenhum compromisso encontrado neste filtro.')}</div>`;

  $('#view-team').innerHTML=`<div class="page-head"><div><span class="kicker">Nossa identidade</span><h1>O Real Império</h1><p>Informações oficiais e a história do time.</p></div></div><div class="grid grid-2"><article class="card card-accent"><img src="assets/logo-real-imperio.svg" alt="Escudo Real Império FC" style="width:min(280px,80%);margin:0 auto 20px;border-radius:22px"><h2>${escapeHtml(d.team.name)}</h2><p class="team-story">${escapeHtml(d.team.description)}</p></article><article class="card"><h2 style="margin-bottom:18px">Informações</h2><ul class="info-list"><li><span>Bairro</span><strong>${escapeHtml(d.team.neighborhood)}</strong></li><li><span>Cidade</span><strong>${escapeHtml(d.team.city)}</strong></li><li><span>Local de treino</span><strong>${escapeHtml(d.team.trainingPlace||'A confirmar')}</strong></li>${d.team.founded?`<li><span>Fundação</span><strong>${escapeHtml(d.team.founded)}</strong></li>`:''}<li><span>Administrador geral</span><strong>${escapeHtml(d.team.generalAdmin)}</strong></li></ul></article></div>`;

  $('#view-players').innerHTML=`<div class="page-head"><div><span class="kicker">Nosso elenco</span><h1>Jogadores</h1><p>Conheça os atletas cadastrados e aprovados pela administração.</p></div></div><div class="grid grid-3">${approved.length?approved.sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||a.name.localeCompare(b.name)).map(playerCard).join(''):emptyState('Os jogadores aprovados aparecerão aqui com foto, descrição e saldo de gols.')}</div>`;

  $('#view-register').innerHTML=`<div class="page-head"><div><span class="kicker">Faça parte</span><h1>Cadastro de Jogador</h1><p>Envie seu cadastro. A administração analisará e poderá aceitar ou negar a solicitação.</p></div></div><article class="card form-card"><form id="register-form"><div class="form-grid"><div class="field full"><label>Nome completo *</label><input name="name" autocomplete="name" required maxlength="80"></div><div class="field"><label>E-mail *</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Senha *</label><input name="password" type="password" autocomplete="new-password" required minlength="6"></div><div class="field"><label>Posição</label><select name="position">${positionOptions()}</select></div><div class="field"><label>WhatsApp</label><input name="whatsapp" inputmode="tel"></div></div><p class="form-help">Após o envio, seu cadastro ficará pendente até a decisão de um administrador. O saldo de gols começa em 0 e é atualizado somente pela administração.</p><div class="form-actions"><button class="btn btn-gold" type="submit">Enviar solicitação</button></div></form></article>`;

  renderAccount();
  renderHeader();
}

export function renderAccount(){
  const v=$('#view-account'),s=state.session;
  if(!s){
    v.innerHTML=`<div class="page-head"><div><span class="kicker">Área de acesso</span><h1>Entrar</h1><p>Administradores e jogadores cadastrados podem acessar por aqui.</p></div></div><article class="card account-card"><form id="login-form"><div class="form-grid"><div class="field full"><label>E-mail</label><input name="email" type="email" autocomplete="username" required></div><div class="field full"><label>Senha</label><input name="password" type="password" autocomplete="current-password" required></div></div><div class="form-actions"><button class="btn btn-gold btn-full" type="submit">Entrar</button></div><p class="form-help" style="margin-top:12px">Administração local ainda não configurada neste navegador? <a href="setup-local.html">Configurar acesso local</a>.</p></form></article>`;
    return;
  }
  if(isAdmin()){
    v.innerHTML=`<div class="page-head"><div><span class="kicker">Sessão ativa</span><h1>Minha conta</h1></div></div><article class="card account-card account-state"><div class="account-avatar">ADM</div><h2>${s.role==='superadmin'?'Administração Total':'Administrador Geral'}</h2><p class="form-help">Sua sessão administrativa está ativa neste navegador.</p><div class="form-actions account-actions"><button class="btn btn-gold" data-nav="admin">Abrir painel</button><button class="btn btn-danger" data-action="logout">Sair</button></div></article>`;
    return;
  }

  const p=currentPlayer();
  if(!p){v.innerHTML=emptyState('Sessão de jogador não encontrada.');return}
  const photo=safeImageSrc(p.photo),goals=playerGoals(p),lbl=p.status==='approved'?'Aprovado':p.status==='rejected'?'Negado':'Pendente',cls=p.status==='approved'?'badge-approved':p.status==='rejected'?'badge-rejected':'badge-pending';
  v.innerHTML=`<div class="page-head"><div><span class="kicker">Minha conta</span><h1>Olá, ${escapeHtml(p.name.split(' ')[0])}</h1><p>Atualize seus dados pessoais, foto, número, posição e senha.</p></div></div>
  <div class="account-settings-layout"><aside class="card account-profile-card">${photo?`<img class="account-profile-photo" src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(p.name)}">`:`<div class="account-profile-photo account-profile-placeholder">${escapeHtml(initials(p.name))}</div>`}<h2>${escapeHtml(p.name)}</h2><div class="account-badges"><span class="badge ${cls}">${lbl}</span><span class="badge badge-training">Gols: ${goals}</span></div><dl class="account-summary"><div><dt>Número</dt><dd>${escapeHtml(p.number||'—')}</dd></div><div><dt>Posição</dt><dd>${escapeHtml(p.position||'—')}</dd></div><div><dt>E-mail</dt><dd>${escapeHtml(p.email)}</dd></div></dl><button class="btn btn-danger btn-full" type="button" data-action="logout">Sair</button></aside>
  <article class="card account-settings-card"><div class="settings-heading"><span class="kicker">Configurações</span><h2>Dados do jogador</h2><p>As alterações ficam salvas no seu perfil. O saldo de gols e o status continuam sob controle da administração.</p></div><form id="player-account-form"><div class="form-grid"><div class="field full"><label>Nome completo *</label><input name="name" value="${escapeHtml(p.name)}" required maxlength="80"></div><div class="field"><label>E-mail *</label><input name="email" type="email" value="${escapeHtml(p.email)}" required></div><div class="field"><label>Número da camisa</label><input name="number" inputmode="numeric" maxlength="3" value="${escapeHtml(p.number||'')}"></div><div class="field"><label>Posição</label><select name="position">${positionOptions(p.position||'')}</select></div><div class="field"><label>WhatsApp</label><input name="whatsapp" inputmode="tel" value="${escapeHtml(p.whatsapp||'')}"></div><div class="field full"><label>Descrição</label><textarea name="bio">${escapeHtml(p.bio||'')}</textarea></div><div class="field full"><label>Foto por URL</label><input name="photoUrl" type="url" placeholder="https://..." value="${p.photo&&!String(p.photo).startsWith('data:')?escapeHtml(p.photo):''}"></div><div class="field full"><label>Adicionar / trocar imagem</label><input name="photoFile" type="file" accept="image/*"></div>${photo?`<label class="check-row full"><input type="checkbox" name="removePhoto" value="1"><span>Remover minha foto atual</span></label>`:''}<div class="field"><label>Nova senha</label><input name="newPassword" type="password" minlength="6" autocomplete="new-password" placeholder="Deixe em branco para manter"></div><div class="field"><label>Confirmar nova senha</label><input name="confirmPassword" type="password" minlength="6" autocomplete="new-password"></div></div><div class="form-actions"><button class="btn btn-gold" type="submit">Salvar configurações</button></div></form></article></div>`;
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
  if(update){history.replaceState(null,'',`#${view}`);scrollTo({top:0,behavior:'smooth'})}
}
