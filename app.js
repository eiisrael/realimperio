import {state,saveData,saveSession,isAdmin,currentPlayer,logAction,escapeHtml,formatDate} from './js/state.js';
import {renderPublic,showView} from './js/render.js';
import {renderAdmin,modalHtml,saveAdminForm,compressImage} from './js/admin.js';
import {renderLineupPublic,renderLineupAdmin,assignLineupPlayer,clearLineupSlot,clearLineupAll,removePlayerFromLineup} from './js/lineup.js';
import {
  enableRemoteSync,bootstrapRemote,loadRemoteState,remoteRegister,remoteLogin,remoteLogout,
  remoteUpdatePlayerProfile,remoteAdminSetPlayerStatus,remoteAdminDeletePlayer,
  remoteAdminUpsertPlayer,remoteSaveContent
} from './js/backend.js';

const $=s=>document.querySelector(s);

function toast(msg,type=''){
  const e=document.createElement('div');
  e.className=`toast ${type}`;
  e.textContent=msg;
  $('#toast-root').appendChild(e);
  setTimeout(()=>e.remove(),3600);
}

function openModal(html){$('#modal-content').innerHTML=html;$('#modal').showModal()}
function closeModal(){if($('#modal').open)$('#modal').close();$('#modal-content').innerHTML=''}

function refresh(){
  renderPublic();
  renderLineupPublic();
  renderAdmin();
  renderLineupAdmin();
  showView(state.currentView,false);
}

async function register(form){
  const f=new FormData(form);
  const name=String(f.get('name')).trim();
  const email=String(f.get('email')).trim().toLowerCase();
  const pass=String(f.get('password'));
  await remoteRegister({
    name,
    email,
    password:pass,
    position:String(f.get('position')||''),
    whatsapp:String(f.get('whatsapp')||'')
  });
  saveSession(null);
  await loadRemoteState();
  refresh();
  showView('account');
  toast('Cadastro enviado. Sua conta está em análise técnica.','success');
}

async function savePlayerAccount(form){
  const p=currentPlayer();
  if(!p)throw new Error('Sessão de jogador não encontrada.');
  const f=new FormData(form);
  const email=String(f.get('email')).trim().toLowerCase();
  const name=String(f.get('name')).trim();
  if(!name)throw new Error('Informe seu nome.');

  const newPassword=String(f.get('newPassword')||'');
  const confirmPassword=String(f.get('confirmPassword')||'');
  if(newPassword||confirmPassword){
    if(newPassword.length<6)throw new Error('A nova senha precisa ter pelo menos 6 caracteres.');
    if(newPassword!==confirmPassword)throw new Error('A confirmação da nova senha não confere.');
  }

  const file=f.get('photoFile');
  let photo=p.photo||'';
  if(f.get('removePhoto'))photo='';
  else if(file?.size)photo=await compressImage(file,1000,.82);

  await remoteUpdatePlayerProfile({
    name,
    email,
    number:String(f.get('number')||'').trim(),
    position:String(f.get('position')||'').trim(),
    whatsapp:String(f.get('whatsapp')||'').trim(),
    bio:String(f.get('bio')||'').trim(),
    photo,
    newPassword
  });

  saveSession({...state.session,name});
  await loadRemoteState();
  refresh();
  showView('account',false);
  toast('Configurações salvas.','success');
}

async function login(form){
  const f=new FormData(form);
  const email=String(f.get('email')).trim().toLowerCase();
  const pass=String(f.get('password'));
  const session=await remoteLogin(email,pass);

  saveSession(session);
  await loadRemoteState();
  refresh();

  if(isAdmin()){
    showView('admin');
    toast('Acesso administrativo liberado.','success');
  }else{
    showView('account');
    toast('Login realizado.','success');
  }
}

function openNews(id){
  const n=state.data.news.find(x=>x.id===id);
  if(!n)return;
  const image=String(n.image||'');
  openModal(`<article class="news-modal"><span class="kicker">Notícia do Real Império FC</span><h2>${escapeHtml(n.title)}</h2><time>${formatDate(n.date,{day:'2-digit',month:'long',year:'numeric'})}</time>${image?`<img class="news-modal-image" src="${escapeHtml(image)}" alt="Imagem da notícia ${escapeHtml(n.title)}">`:''}<div class="news-modal-body">${escapeHtml(n.body).replace(/\n/g,'<br>')}</div></article>`);
}

function remove(kind,id){
  const key={player:'players',event:'events',news:'news'}[kind];
  if(!key)return;
  const item=state.data[key].find(x=>x.id===id);
  openModal(`<h2>Confirmar exclusão</h2><p class="team-story">Deseja excluir este registro?</p><div class="form-actions"><button class="btn btn-dark" data-action="close-modal">Cancelar</button><button class="btn btn-danger" id="yes-delete">Excluir</button></div>`);
  $('#yes-delete').onclick=async()=>{
    try{
      if(kind==='player'){
        removePlayerFromLineup(id);
        await remoteAdminDeletePlayer(id);
      }else{
        state.data[key]=state.data[key].filter(x=>x.id!==id);
        logAction(`Registro excluído: ${item?.name||item?.title||kind}`);
        await saveData();
      }
      await loadRemoteState();
      closeModal();
      refresh();
      toast('Registro excluído.','success');
    }catch(error){
      console.error(error);
      toast(error.message||'Não foi possível excluir.','error');
    }
  };
}

document.addEventListener('change',e=>{
  if(e.target.id==='lineup-player-select')state.lineupSelectedPlayerId=e.target.value;

  if(e.target.id==='player-photo-file'){
    const file=e.target.files?.[0];
    if(!file)return;
    const frame=document.querySelector('.account-photo-frame');
    if(!frame)return;
    const url=URL.createObjectURL(file);
    let photo=frame.querySelector('.account-profile-photo');
    if(photo?.tagName==='IMG'){
      photo.src=url;
    }else{
      const img=document.createElement('img');
      img.className='account-profile-photo';
      img.src=url;
      img.alt='Prévia da nova foto';
      photo?.replaceWith(img);
    }
    const removePhoto=document.querySelector('input[name="removePhoto"]');
    if(removePhoto)removePhoto.checked=false;
  }
});

document.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-nav]');
  if(nav){showView(nav.dataset.nav);return}

  const t=e.target.closest('[data-admin-tab]');
  if(t){state.adminTab=t.dataset.adminTab;renderAdmin();renderLineupAdmin();return}

  const f=e.target.closest('[data-agenda-filter]');
  if(f){state.agendaFilter=f.dataset.agendaFilter;renderPublic();renderLineupPublic();showView('agenda',false);return}

  const a=e.target.closest('[data-action]');
  if(!a)return;
  const act=a.dataset.action,id=a.dataset.id;

  try{
    if(act==='close-modal')return closeModal();
    if(act==='open-news'){openNews(id);return}
    if(act==='logout'){
      await remoteLogout();
      saveSession(null);
      state.adminTab='dashboard';
      await loadRemoteState();
      refresh();
      showView('home');
      return;
    }
    if(!isAdmin())return;

    if(act==='lineup-assign-slot'){
      if(a.dataset.dragged==='1'){
        delete a.dataset.dragged;
        return;
      }
      const selected=state.lineupSelectedPlayerId||$('#lineup-player-select')?.value||'';
      const result=assignLineupPlayer(a.dataset.slot,selected);
      if(!result.ok){toast(result.message,'error');return}
      state.lineupSelectedPlayerId=result.player.id;
      logAction(`Escalação atualizada: ${result.player.name}`);
      await saveData();
      refresh();
      toast(`${result.player.name} posicionado na escalação.`,'success');
      return;
    }

    if(act==='lineup-clear-slot'){
      if(clearLineupSlot(a.dataset.slot)){
        logAction('Posição removida da escalação');
        await saveData();
        refresh();
        toast('Posição liberada.','success');
      }
      return;
    }

    if(act==='lineup-clear-all'){
      openModal(`<h2>Limpar escalação?</h2><p class="team-story">Todos os 11 espaços do campo serão liberados. Os jogadores continuarão cadastrados normalmente.</p><div class="form-actions"><button class="btn btn-dark" data-action="close-modal">Cancelar</button><button class="btn btn-danger" id="yes-clear-lineup">Limpar escalação</button></div>`);
      $('#yes-clear-lineup').onclick=async()=>{
        try{
          clearLineupAll();
          logAction('Escalação foi limpa');
          await saveData();
          closeModal();
          refresh();
          toast('Escalação limpa.','success');
        }catch(error){
          console.error(error);
          toast(error.message||'Não foi possível limpar a escalação.','error');
        }
      };
      return;
    }

    if(act==='approve-player'||act==='reject-player'){
      const status=act==='approve-player'?'approved':'rejected';
      await remoteAdminSetPlayerStatus(id,status);
      if(status==='rejected')removePlayerFromLineup(id);
      await loadRemoteState();
      refresh();
      toast(status==='approved'?'Jogador aprovado.':'Solicitação negada.','success');
      return;
    }

    if(act.startsWith('new-')){openModal(modalHtml(act.slice(4)));return}
    if(act.startsWith('edit-')){
      const k=act.slice(5),map={player:'players',event:'events',news:'news'},item=state.data[map[k]]?.find(x=>x.id===id);
      if(item)openModal(modalHtml(k,item));
      return;
    }
    if(act.startsWith('delete-'))remove(act.slice(7),id);
  }catch(error){
    console.error(error);
    toast(error.message||'Não foi possível concluir.','error');
  }
});

document.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
    if(e.target.id==='register-form')await register(e.target);
    else if(e.target.id==='login-form')await login(e.target);
    else if(e.target.id==='player-account-form')await savePlayerAccount(e.target);
    else{
      const form=e.target;
      const pendingPassword=form.id==='player-admin-form'?String(new FormData(form).get('password')||''):'';
      await saveAdminForm(form);
      if(form.id==='player-admin-form'){
        const email=String(new FormData(form).get('email')||'').trim().toLowerCase();
        const player=state.data.players.find(p=>p.id===form.dataset.id)||state.data.players.find(p=>p.email.toLowerCase()===email);
        if(!player)throw new Error('Não foi possível localizar o jogador salvo.');
        await remoteAdminUpsertPlayer(player,pendingPassword);
      }else{
        await remoteSaveContent(state.data);
      }
      await loadRemoteState();
      closeModal();
      refresh();
      toast('Alterações salvas.','success');
    }
  }catch(err){
    console.error(err);
    toast(err.message||'Não foi possível concluir.','error');
  }
});

$('#account-btn').onclick=()=>showView('account');
$('#admin-btn').onclick=()=>showView('admin');
$('#modal-close').onclick=closeModal;
$('#modal').onclick=e=>{if(e.target===$('#modal'))closeModal()};

const h=location.hash.slice(1);
if(['home','agenda','team','lineup','players','register','account','admin'].includes(h))state.currentView=h;

enableRemoteSync();
refresh();
bootstrapRemote()
  .then(()=>refresh())
  .catch(error=>{
    console.error(error);
    toast('Não foi possível conectar ao servidor. Verifique a configuração do Supabase.','error');
  });
