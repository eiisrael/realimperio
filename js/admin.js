import {state,isAdmin,escapeHtml,safeImageSrc,formatDate,todayIso,uid,saveData,logAction,sha256} from './state.js';
import {emptyState} from './render.js';

const $=s=>document.querySelector(s);
const goals=p=>Math.max(0,Number.parseInt(p?.goals,10)||0);

function positionOptions(current=''){
  const options=['Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Outro'];
  const extra=current&&!options.includes(current)?`<option selected>${escapeHtml(current)}</option>`:'';
  return `<option value="">Selecione</option>${extra}${options.map(x=>`<option ${current===x?'selected':''}>${x}</option>`).join('')}`;
}

export function renderAdmin(){
  const v=$('#view-admin');
  if(!isAdmin()){v.innerHTML=emptyState('Acesso restrito à administração.');return}
  const pc=state.data.players.filter(p=>p.status==='pending').length;
  const tabs=[['dashboard','Visão geral'],['requests',`Solicitações${pc?` (${pc})`:''}`],['players','Jogadores'],['events','Agenda'],['news','Notícias'],['team','O Time']];
  v.innerHTML=`<div class="page-head"><div><span class="kicker">Gestão do clube</span><h1>Painel Administrativo</h1><p>Gerencie jogadores, escalação, agenda, notícias e informações oficiais.</p></div></div><div class="admin-layout"><aside class="card admin-sidebar">${tabs.map(([id,l])=>`<button class="admin-tab ${state.adminTab===id?'active':''}" data-admin-tab="${id}">${l}</button>`).join('')}</aside><section class="admin-panel">${tabHtml()}</section></div>`;
}

function tabHtml(){
  const d=state.data;
  if(state.adminTab==='dashboard')return `<div class="grid grid-2"><div class="card card-accent"><h2>Resumo</h2><div class="stats admin-stats"><div class="stat-card"><span>Jogadores</span><strong>${d.players.filter(p=>p.status==='approved').length}</strong></div><div class="stat-card"><span>Pendentes</span><strong>${d.players.filter(p=>p.status==='pending').length}</strong></div><div class="stat-card"><span>Eventos</span><strong>${d.events.length}</strong></div><div class="stat-card"><span>Notícias</span><strong>${d.news.length}</strong></div></div></div><div class="card"><h2>Ações rápidas</h2><div class="form-actions admin-quick-actions"><button class="btn btn-gold" data-action="new-player">Adicionar jogador</button><button class="btn btn-red" data-admin-tab="events">Marcar jogo/treino</button><button class="btn btn-dark" data-admin-tab="news">Publicar notícia</button></div></div></div>`;

  if(state.adminTab==='requests'){
    const a=d.players.filter(p=>p.status==='pending').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    return `<div class="admin-toolbar"><div><h2>Solicitações pendentes</h2><p class="form-help">Aceite ou negue novos cadastros.</p></div></div><div class="grid">${a.length?a.map(p=>`<article class="card approval-card"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.email)}${p.position?' · '+escapeHtml(p.position):''} · ${goals(p)} gols</p></div><div class="approval-actions"><button class="btn btn-gold btn-sm" data-action="approve-player" data-id="${p.id}">Aceitar</button><button class="btn btn-danger btn-sm" data-action="reject-player" data-id="${p.id}">Negar</button></div></article>`).join(''):emptyState('Não há solicitações pendentes.')}</div>`;
  }

  if(state.adminTab==='players')return `<div class="admin-toolbar"><div><h2>Jogadores</h2><p class="form-help">Gerencie imagem, dados pessoais, número, posição, gols e senha de acesso.</p></div><button class="btn btn-gold btn-sm" data-action="new-player">+ Novo jogador</button></div>${d.players.length?`<div class="table-wrap"><table><thead><tr><th>Jogador</th><th>Status</th><th>Posição</th><th>Nº</th><th>Gols</th><th>E-mail</th><th>Ações</th></tr></thead><tbody>${[...d.players].sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${p.status}</td><td>${escapeHtml(p.position||'—')}</td><td>${escapeHtml(p.number||'—')}</td><td><strong>${goals(p)}</strong></td><td>${escapeHtml(p.email)}</td><td class="actions-cell"><button class="btn btn-dark btn-sm" data-action="edit-player" data-id="${p.id}">Editar</button><button class="btn btn-danger btn-sm" data-action="delete-player" data-id="${p.id}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`:emptyState('Nenhum jogador cadastrado.')}`;

  if(state.adminTab==='events')return tableSection('Agenda','Marque jogos e treinos.','new-event','Novo evento',d.events,[['Tipo',e=>e.type==='game'?'Jogo':'Treino'],['Data',e=>formatDate(e.date,{day:'2-digit',month:'2-digit',year:'numeric'})],['Título',e=>e.title],['Horário',e=>e.time||'—'],['Local',e=>e.place||'—']], 'event');

  if(state.adminTab==='news')return `<div class="admin-toolbar"><div><h2>Notícias</h2><p class="form-help">Adicione e modifique notícias sobre o time.</p></div><button class="btn btn-gold btn-sm" data-action="new-news">+ Nova notícia</button></div><div class="grid">${d.news.length?[...d.news].sort((a,b)=>b.date.localeCompare(a.date)).map(n=>`<article class="card"><time class="form-help">${formatDate(n.date,{day:'2-digit',month:'long',year:'numeric'})}</time><h3>${escapeHtml(n.title)}</h3><p class="team-story">${escapeHtml(n.body)}</p><div class="form-actions"><button class="btn btn-dark btn-sm" data-action="edit-news" data-id="${n.id}">Editar</button><button class="btn btn-danger btn-sm" data-action="delete-news" data-id="${n.id}">Excluir</button></div></article>`).join(''):emptyState('Nenhuma notícia publicada.')}</div>`;

  if(state.adminTab==='team')return `<article class="card"><h2>Informações do time</h2><form id="team-form"><div class="form-grid"><div class="field"><label>Nome</label><input name="name" value="${escapeHtml(d.team.name)}" required></div><div class="field"><label>Bairro</label><input name="neighborhood" value="${escapeHtml(d.team.neighborhood)}"></div><div class="field"><label>Cidade</label><input name="city" value="${escapeHtml(d.team.city)}"></div><div class="field"><label>Fundação</label><input name="founded" value="${escapeHtml(d.team.founded)}"></div><div class="field full"><label>Local de treino</label><input name="trainingPlace" value="${escapeHtml(d.team.trainingPlace)}"></div><div class="field full"><label>Administrador geral (público)</label><input name="generalAdmin" type="email" value="${escapeHtml(d.team.generalAdmin)}"></div><div class="field full"><label>Descrição</label><textarea name="description">${escapeHtml(d.team.description)}</textarea></div></div><div class="form-actions"><button class="btn btn-gold">Salvar informações</button></div></form></article>`;
  return '';
}

function tableSection(title,help,newAction,newLabel,items,cols,type){
  return `<div class="admin-toolbar"><div><h2>${title}</h2><p class="form-help">${help}</p></div><button class="btn btn-gold btn-sm" data-action="${newAction}">+ ${newLabel}</button></div>${items.length?`<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c[0]}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${items.map(x=>`<tr>${cols.map(c=>`<td>${escapeHtml(c[1](x))}</td>`).join('')}<td class="actions-cell"><button class="btn btn-dark btn-sm" data-action="edit-${type}" data-id="${x.id}">Editar</button><button class="btn btn-danger btn-sm" data-action="delete-${type}" data-id="${x.id}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`:emptyState('Nenhum registro cadastrado.')}`;
}

export function modalHtml(kind,item={}){
  if(kind==='player'){
    const photo=safeImageSrc(item.photo||'');
    return `<h2>${item.id?'Editar jogador':'Adicionar jogador'}</h2><form id="player-admin-form" data-id="${item.id||''}">${photo?`<div class="admin-player-preview"><img src="${escapeHtml(photo)}" alt="Foto atual de ${escapeHtml(item.name||'jogador')}"></div>`:''}<div class="form-grid"><div class="field full"><label>Nome *</label><input name="name" value="${escapeHtml(item.name||'')}" required></div><div class="field"><label>E-mail *</label><input name="email" type="email" value="${escapeHtml(item.email||'')}" required></div><div class="field"><label>Status</label><select name="status"><option value="pending" ${item.status==='pending'?'selected':''}>Pendente</option><option value="approved" ${item.status==='approved'||!item.status?'selected':''}>Aprovado</option><option value="rejected" ${item.status==='rejected'?'selected':''}>Negado</option></select></div><div class="field"><label>Posição</label><select name="position">${positionOptions(item.position||'')}</select></div><div class="field"><label>Número</label><input name="number" inputmode="numeric" maxlength="3" value="${escapeHtml(item.number||'')}"></div><div class="field"><label>Saldo de gols</label><input name="goals" type="number" min="0" step="1" value="${goals(item)}"></div><div class="field"><label>WhatsApp</label><input name="whatsapp" inputmode="tel" value="${escapeHtml(item.whatsapp||'')}"></div><div class="field full"><label>Foto por URL</label><input name="photo" type="url" placeholder="https://..." value="${item.photo&&!String(item.photo).startsWith('data:')?escapeHtml(item.photo):''}"></div><div class="field full"><label>Adicionar / trocar imagem</label><input name="photoFile" type="file" accept="image/*"></div>${photo?`<label class="check-row full"><input type="checkbox" name="removePhoto" value="1"><span>Remover imagem atual</span></label>`:''}<div class="field full"><label>Descrição</label><textarea name="bio">${escapeHtml(item.bio||'')}</textarea></div><div class="field full"><label>${item.id?'Nova senha':'Senha de acesso'} ${item.id?'':'*'}</label><input name="password" type="password" minlength="6" autocomplete="new-password" ${item.id?'placeholder="Deixe em branco para manter a atual"':'required'}></div></div><div class="form-actions"><button class="btn btn-dark" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-gold">Salvar</button></div></form>`;
  }

  if(kind==='event')return `<h2>${item.id?'Editar compromisso':'Novo compromisso'}</h2><form id="event-form" data-id="${item.id||''}"><div class="form-grid"><div class="field"><label>Tipo</label><select name="type"><option value="game" ${item.type==='game'?'selected':''}>Jogo</option><option value="training" ${item.type==='training'||!item.type?'selected':''}>Treino</option></select></div><div class="field"><label>Data *</label><input name="date" type="date" value="${item.date||todayIso()}" required></div><div class="field"><label>Horário</label><input name="time" type="time" value="${item.time||''}"></div><div class="field"><label>Local</label><input name="place" value="${escapeHtml(item.place||'')}"></div><div class="field full"><label>Título *</label><input name="title" value="${escapeHtml(item.title||'')}" required></div><div class="field full"><label>Adversário</label><input name="opponent" value="${escapeHtml(item.opponent||'')}"></div><div class="field full"><label>Observações</label><textarea name="notes">${escapeHtml(item.notes||'')}</textarea></div></div><div class="form-actions"><button class="btn btn-dark" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-gold">Salvar</button></div></form>`;

  if(kind==='news')return `<h2>${item.id?'Editar notícia':'Nova notícia'}</h2><form id="news-form" data-id="${item.id||''}"><div class="form-grid"><div class="field full"><label>Título *</label><input name="title" value="${escapeHtml(item.title||'')}" required></div><div class="field"><label>Data *</label><input name="date" type="date" value="${item.date||todayIso()}" required></div><div class="field full"><label>Notícia *</label><textarea name="body" required>${escapeHtml(item.body||'')}</textarea></div></div><div class="form-actions"><button class="btn btn-dark" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-gold">Salvar</button></div></form>`;

  return '';
}

export function compressImage(file,maxWidth=1400,q=.82){
  return new Promise((res,rej)=>{
    if(!file)return res('');
    const r=new FileReader();
    r.onerror=()=>rej(new Error('Não foi possível ler a imagem.'));
    r.onload=()=>{
      const i=new Image();
      i.onerror=()=>rej(new Error('Imagem inválida.'));
      i.onload=()=>{
        const s=Math.min(1,maxWidth/i.width),c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(i.width*s));c.height=Math.max(1,Math.round(i.height*s));
        c.getContext('2d').drawImage(i,0,0,c.width,c.height);
        res(c.toDataURL('image/jpeg',q));
      };
      i.src=r.result;
    };
    r.readAsDataURL(file);
  });
}

export async function saveAdminForm(form){
  const fd=new FormData(form),id=form.dataset.id,d=state.data;

  if(form.id==='player-admin-form'){
    let p=id?d.players.find(x=>x.id===id):null;
    const email=String(fd.get('email')).trim().toLowerCase();
    if(d.players.some(x=>x.id!==id&&x.email.toLowerCase()===email))throw new Error('E-mail já cadastrado.');
    const f=fd.get('photoFile'),pass=String(fd.get('password')||'');
    let photo=p?.photo||String(fd.get('photo')||'').trim();
    if(fd.get('removePhoto'))photo='';
    else if(f?.size)photo=await compressImage(f);
    else if(String(fd.get('photo')||'').trim())photo=String(fd.get('photo')).trim();

    if(!p){
      if(pass.length<6)throw new Error('Defina uma senha de pelo menos 6 caracteres para o novo jogador.');
      p={id:uid('player'),createdAt:new Date().toISOString(),passwordHash:await sha256(pass),goals:0};
      d.players.push(p);
    }else if(pass){
      if(pass.length<6)throw new Error('A nova senha precisa ter pelo menos 6 caracteres.');
      p.passwordHash=await sha256(pass);
    }

    const playerGoals=Math.max(0,Number.parseInt(String(fd.get('goals')||'0'),10)||0);
    Object.assign(p,{name:String(fd.get('name')).trim(),email,status:String(fd.get('status')),position:String(fd.get('position')||'').trim(),number:String(fd.get('number')||'').trim(),whatsapp:String(fd.get('whatsapp')||'').trim(),goals:playerGoals,photo,bio:String(fd.get('bio')||'').trim()});
    logAction(`Jogador salvo: ${p.name}`);
  }

  if(form.id==='event-form'){
    let x=id?d.events.find(x=>x.id===id):null;
    if(!x){x={id:uid('evt')};d.events.push(x)}
    Object.assign(x,{type:String(fd.get('type')),date:String(fd.get('date')),time:String(fd.get('time')||''),place:String(fd.get('place')||'').trim(),title:String(fd.get('title')).trim(),opponent:String(fd.get('opponent')||'').trim(),notes:String(fd.get('notes')||'').trim()});
    logAction(`Evento salvo: ${x.title}`);
  }

  if(form.id==='news-form'){
    let x=id?d.news.find(x=>x.id===id):null;
    if(!x){x={id:uid('news')};d.news.push(x)}
    Object.assign(x,{title:String(fd.get('title')).trim(),date:String(fd.get('date')),body:String(fd.get('body')).trim()});
    logAction(`Notícia salva: ${x.title}`);
  }

  if(form.id==='team-form'){
    d.team={...d.team,name:String(fd.get('name')).trim(),neighborhood:String(fd.get('neighborhood')).trim(),city:String(fd.get('city')).trim(),founded:String(fd.get('founded')).trim(),trainingPlace:String(fd.get('trainingPlace')).trim(),generalAdmin:String(fd.get('generalAdmin')).trim(),description:String(fd.get('description')).trim()};
    logAction('Informações do time atualizadas');
  }
  saveData();
}
