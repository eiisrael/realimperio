import {state,setData,saveData,saveSession,setRemoteSaveHandler,isAdmin} from './state.js';

export const SUPABASE_URL='https://mwdtumonodwydqhlkwos.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY='sb_publishable_sUg8clNao78UQa1XwK8EIA_ahj8V5Q8';

const rpcUrl=name=>`${SUPABASE_URL}/rest/v1/rpc/${name}`;

async function rpc(name,params={}){
  const response=await fetch(rpcUrl(name),{
    method:'POST',
    headers:{
      apikey:SUPABASE_PUBLISHABLE_KEY,
      'Content-Type':'application/json',
      Accept:'application/json'
    },
    body:JSON.stringify(params)
  });

  const text=await response.text();
  let data=null;
  if(text){
    try{data=JSON.parse(text)}catch{data=text}
  }

  if(!response.ok){
    const message=typeof data==='object'&&data?.message
      ? data.message
      : typeof data==='string'&&data.trim()
        ? data
        : 'Não foi possível concluir a operação no servidor.';
    throw new Error(message);
  }
  return data;
}

const token=()=>String(state.session?.remoteToken||'');

export async function remoteSessionInfo(){
  if(!token())return null;
  return rpc('app_session_info',{p_token:token()});
}

export async function loadRemoteState(){
  const data=await rpc('app_get_state',{p_token:token()||null});
  setData(data||{});
  return state.data;
}

export async function bootstrapRemote(){
  const currentToken=token();
  if(currentToken){
    const info=await remoteSessionInfo();
    if(info?.role){
      saveSession({...info,remoteToken:currentToken});
    }else{
      saveSession(null);
    }
  }
  return loadRemoteState();
}

export async function remoteRegister({name,email,password,position='',whatsapp=''}){
  return rpc('app_register_player',{
    p_name:String(name||'').trim(),
    p_email:String(email||'').trim().toLowerCase(),
    p_password:String(password||''),
    p_position:String(position||'').trim(),
    p_whatsapp:String(whatsapp||'').trim()
  });
}

export async function remoteLogin(email,password){
  return rpc('app_login',{
    p_email:String(email||'').trim().toLowerCase(),
    p_password:String(password||'')
  });
}

export async function remoteLogout(){
  if(!token())return;
  try{await rpc('app_logout',{p_token:token()})}catch(error){console.warn(error)}
}

function contentPayload(data=state.data){
  return {
    team:data.team||{},
    coach:data.coach||{},
    events:Array.isArray(data.events)?data.events:[],
    news:Array.isArray(data.news)?data.news:[],
    lineup:data.lineup||{},
    audit:Array.isArray(data.audit)?data.audit.slice(0,100):[]
  };
}

export async function remoteSaveContent(data=state.data){
  if(!isAdmin()||!token())return;
  return rpc('app_admin_save_content',{
    p_token:token(),
    p_content:contentPayload(data)
  });
}

export async function remoteAdminUpsertPlayer(player,password=''){
  if(!isAdmin()||!token())throw new Error('Sessão administrativa inválida.');
  return rpc('app_admin_upsert_player',{
    p_token:token(),
    p_player:{
      id:player?.id||'',
      name:player?.name||'',
      email:player?.email||'',
      whatsapp:player?.whatsapp||'',
      position:player?.position||'',
      number:player?.number||'',
      goals:Math.max(0,Number.parseInt(player?.goals,10)||0),
      bio:player?.bio||'',
      photo:player?.photo||'',
      status:player?.status||'pending',
      createdAt:player?.createdAt||new Date().toISOString()
    },
    p_password:String(password||'')
  });
}

export async function remoteAdminSetPlayerStatus(playerId,status){
  return rpc('app_admin_set_player_status',{
    p_token:token(),
    p_player_id:String(playerId||''),
    p_status:String(status||'')
  });
}

export async function remoteAdminDeletePlayer(playerId){
  return rpc('app_admin_delete_player',{
    p_token:token(),
    p_player_id:String(playerId||'')
  });
}

export async function remoteUpdatePlayerProfile({name,email,number='',position='',whatsapp='',bio='',photo='',newPassword=''}){
  if(!token())throw new Error('Sessão de jogador inválida.');
  return rpc('app_player_update_profile',{
    p_token:token(),
    p_name:String(name||'').trim(),
    p_email:String(email||'').trim().toLowerCase(),
    p_number:String(number||'').trim(),
    p_position:String(position||'').trim(),
    p_whatsapp:String(whatsapp||'').trim(),
    p_bio:String(bio||'').trim(),
    p_photo:String(photo||''),
    p_new_password:String(newPassword||'')
  });
}

export function enableRemoteSync(){
  setRemoteSaveHandler(async data=>{
    if(!isAdmin()||!token())return;
    await remoteSaveContent(data);
  });
}

export async function refreshFromServer(){
  await loadRemoteState();
  await saveData({remote:false});
  return state.data;
}
