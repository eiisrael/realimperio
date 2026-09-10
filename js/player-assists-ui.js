import {state} from './state.js';

const assists=player=>Math.max(0,Number.parseInt(player?.assists,10)||0);

function playerFromTooltip(tooltip){
  const name=tooltip.querySelector('.lineup-tooltip-head strong')?.textContent?.trim();
  if(!name)return null;

  const shirtStat=[...tooltip.querySelectorAll('.lineup-tooltip-stat')].find(stat=>
    stat.querySelector('span')?.textContent?.trim()==='Camisa'
  );
  const shirt=shirtStat?.querySelector('strong')?.textContent?.trim();
  const candidates=(state.data?.players||[]).filter(player=>String(player?.name||'').trim()===name);
  if(!candidates.length)return null;
  if(!shirt||shirt==='—')return candidates[0];
  return candidates.find(player=>String(player?.number||'').trim()===shirt)||candidates[0];
}

function addAssistsToTooltip(tooltip){
  const grid=tooltip.querySelector('.lineup-tooltip-grid');
  if(!grid)return;
  const already=[...grid.querySelectorAll('.lineup-tooltip-stat > span')].some(label=>
    label.textContent?.trim()==='Assistências'
  );
  if(already)return;

  const player=playerFromTooltip(tooltip);
  if(!player)return;

  const stat=document.createElement('span');
  stat.className='lineup-tooltip-stat';
  stat.innerHTML=`<span>Assistências</span><strong>${assists(player)}</strong>`;
  grid.appendChild(stat);
}

function enhancePlayerInfo(){
  document.querySelectorAll('#view-lineup .lineup-tooltip').forEach(addAssistsToTooltip);
}

let queued=false;
function scheduleEnhancement(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    enhancePlayerInfo();
  });
}

const lineupView=document.querySelector('#view-lineup');
if(lineupView){
  new MutationObserver(scheduleEnhancement).observe(lineupView,{childList:true,subtree:true});
}

scheduleEnhancement();
