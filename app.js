import {state,saveData,saveSession,isAdmin,sha256,getLocalAdmins,uid,logAction} from './js/state.js';
import {renderPublic,showView} from './js/render.js';
import {renderAdmin,modalHtml,saveAdminForm} from './js/admin.js';
import {renderLineupPublic,renderLineupAdmin,assignLineupPlayer,clearLineupSlot,clearLineupAll,removePlayerFromLineup} from './js/lineup.js';

const $=s=>document.querySelector(s);

function toast(msg,type=''){
  const e=document.createElement('div');
  e.className=`toast ${type}`;
  e.textContent=msg;
  $('#toast-root').appendChild(e);
  setTimeout(()=>e.remove(),3200);
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
  const f=new FormData(form),name=String(f.get('name')).trim(),email=String(f.get('email')).trim().toLowerCase(),pass=String(f.get('password'));
  if(state.data.players.some(p=>p.email.toLowerCase()===email))throw new Error('Este e-mail já possui cadastro.');
  const p={id:uid('player'),name,email,passwordHash:await sha256(pass),position:String(f.get('position')||''),whatsapp:String(f.get('whatsapp')||''),number:'',goals:0,bio:'',photo:'',status:'pending',createdAt:new Date().toISOString()};
  state.data.players.push(p);
  logAction(`Nova solicitação: ${name}`);
  saveData();
  saveSession({role:'player',playerId:p.id,name});
  refresh();
  showView('account');
  toast('Solicitação enviada para aprovação.','success');
}

async function login(form){
  const f=new FormData(form),email=String(f.get('email')).trim().toLowerCase(),pass=String(f.get('password')),eh=await sha256(email),ph=await sha256(pass),admin=getLocalAdmins().find(a=>a.emailHash===eh&&a.passwordHash===ph);
  if(admin){
    saveSession({role:admin.role,name:admin.role==='superadmin'?'Administração':'Administrador Geral'});
    refresh();
    showView('admin');
    toast('Acesso administrativo liberado.','success');
    return;
  }
  const p=state.data.players.find(p=>p.email.toLowerCase()===email&&p.passwordHash===ph);
  if(!p)throw new Error('E-mail ou senha inválidos.');
  saveSession({role:'player',playerId:p.id,name:p.name});
  refresh();
  showView('account');
  toast('Login realizado.','success');
}

function remove(kind,id){
  const key={player:'players',event:'events',news:'news',gallery:'gallery'}[kind],item=state.data[key].find(x=>x.id===id);
  openModal(`<h2>Confirmar exclusão</h2><p class="team-story">Deseja excluir este registro?</p><div class="form-actions"><button class="btn btn-dark" data-action="close-modal">Cancelar</button><button class="btn btn-danger" id="yes-delete">Excluir</button></div>`);
  $('#yes-delete').onclick=()=>{
    if(kind==='player')removePlayerFromLineup(id);
    state.data[key]=state.data[key].filter(x=>x.id!==id);
    logAction(`Registro excluído: ${item?.name||item?.title||kind}`);
    saveData();
    closeModal();
    refresh();
    toast('Registro excluído.');
  };
}

document.addEventListener('change',e=>{
  if(e.target.id==='lineup-player-select')state.lineupSelectedPlayerId=e.target.value;
});

document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');
  if(nav){showView(nav.dataset.nav);return}

  const t=e.target.closest('[data-admin-tab]');
  if(t){state.adminTab=t.dataset.adminTab;renderAdmin();renderLineupAdmin();return}

  const f=e.target.closest('[data-agenda-filter]');
  if(f){state.agendaFilter=f.dataset.agendaFilter;renderPublic();renderLineupPublic();showView('agenda',false);return}

  const a=e.target.closest('[data-action]');
  if(!a)return;
  const act=a.dataset.action,id=a.dataset.id;

  if(act==='close-modal')return closeModal();
  if(act==='logout'){saveSession(null);state.adminTab='dashboard';refresh();showView('home');return}
  if(!isAdmin())return;

  if(act==='lineup-assign-slot'){
    const selected=state.lineupSelectedPlayerId||$('#lineup-player-select')?.value||'';
    const result=assignLineupPlayer(a.dataset.slot,selected);
    if(!result.ok){toast(result.message,'error');return}
    state.lineupSelectedPlayerId=result.player.id;
    logAction(`Escalação atualizada: ${result.player.name}`);
    saveData();
    refresh();
    toast(`${result.player.name} posicionado na escalação.`,'success');
    return;
  }

  if(act==='lineup-clear-slot'){
    if(clearLineupSlot(a.dataset.slot)){
      logAction('Posição removida da escalação');
      saveData();
      refresh();
      toast('Posição liberada.','success');
    }
    return;
  }

  if(act==='lineup-clear-all'){
    openModal(`<h2>Limpar escalação?</h2><p class="team-story">Todos os 11 espaços do campo serão liberados. Os jogadores continuarão cadastrados normalmente.</p><div class="form-actions"><button class="btn btn-dark" data-action="close-modal">Cancelar</button><button class="btn btn-danger" id="yes-clear-lineup">Limpar escalação</button></div>`);
    $('#yes-clear-lineup').onclick=()=>{
      clearLineupAll();
      logAction('Escalação foi limpa');
      saveData();
      closeModal();
      refresh();
      toast('Escalação limpa.','success');
    };
    return;
  }

  if(act==='approve-player'||act==='reject-player'){
    const p=state.data.players.find(x=>x.id===id);
    if(p){
      p.status=act==='approve-player'?'approved':'rejected';
      if(p.status==='rejected')removePlayerFromLineup(p.id);
      saveData();
      refresh();
      toast(p.status==='approved'?'Jogador aprovado.':'Solicitação negada.','success');
    }
    return;
  }

  if(act.startsWith('new-')){openModal(modalHtml(act.slice(4)));return}
  if(act.startsWith('edit-')){
    const k=act.slice(5),map={player:'players',event:'events',news:'news',gallery:'gallery'},item=state.data[map[k]]?.find(x=>x.id===id);
    if(item)openModal(modalHtml(k,item));
    return;
  }
  if(act.startsWith('delete-'))remove(act.slice(7),id);
});

document.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
    if(e.target.id==='register-form')await register(e.target);
    else if(e.target.id==='login-form')await login(e.target);
    else{
      await saveAdminForm(e.target);
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
if(['home','agenda','team','lineup','players','extras','register','account','admin'].includes(h))state.currentView=h;
refresh();
