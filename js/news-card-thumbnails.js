import {state,safeImageSrc} from './state.js';

function unwrapCard(card){
  const thumb=card.querySelector(':scope > .news-card-thumb-wrap');
  if(thumb)thumb.remove();
  const copy=card.querySelector(':scope > .news-card-copy');
  if(copy){
    while(copy.firstChild)card.appendChild(copy.firstChild);
    copy.remove();
  }
  card.classList.remove('has-news-thumb');
}

function enhanceCard(card){
  const id=card?.dataset?.id;
  if(!id)return;
  const news=(state.data?.news||[]).find(item=>String(item.id)===String(id));
  const image=safeImageSrc(news?.image||'');
  if(!image){
    if(card.classList.contains('has-news-thumb'))unwrapCard(card);
    return;
  }

  let copy=card.querySelector(':scope > .news-card-copy');
  if(!copy){
    copy=document.createElement('div');
    copy.className='news-card-copy';
    [...card.childNodes].forEach(child=>copy.appendChild(child));
    card.appendChild(copy);
  }

  let wrap=card.querySelector(':scope > .news-card-thumb-wrap');
  if(!wrap){
    wrap=document.createElement('span');
    wrap.className='news-card-thumb-wrap';
    wrap.setAttribute('aria-hidden','true');
    card.insertBefore(wrap,copy);
  }

  let img=wrap.querySelector('img');
  if(!img){
    img=document.createElement('img');
    img.className='news-card-thumb';
    img.loading='lazy';
    img.decoding='async';
    img.alt='';
    wrap.appendChild(img);
  }
  if(img.getAttribute('src')!==image)img.setAttribute('src',image);
  card.classList.add('has-news-thumb');
}

function enhanceNewsCards(){
  document.querySelectorAll('.home-news-list .news-card-button').forEach(enhanceCard);
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    enhanceNewsCards();
  });
}

const home=document.querySelector('#view-home');
if(home)new MutationObserver(schedule).observe(home,{childList:true,subtree:true});
schedule();
