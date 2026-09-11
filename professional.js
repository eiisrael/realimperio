const emojiPattern=/[⚽⚔🕒📍\uFE0F]/g;

function cleanTextNode(node){
  if(node.nodeType!==Node.TEXT_NODE)return;
  const parent=node.parentElement;
  if(parent&&['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(parent.tagName))return;
  const cleaned=node.nodeValue.replace(emojiPattern,'').replace(/\s{2,}/g,' ');
  if(cleaned!==node.nodeValue)node.nodeValue=cleaned;
}

function cleanNode(root){
  if(root.nodeType===Node.TEXT_NODE){cleanTextNode(root);return}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode()))cleanTextNode(node);
}

function fixManifestHref(){
  const manifest=document.querySelector('link[rel="manifest"]');
  if(!manifest)return;
  const manifestUrl=new URL('/manifest.json',window.location.origin).href;
  if(manifest.href!==manifestUrl)manifest.href=manifestUrl;
}

function loadPlayerUiEnhancements(){
  if(!document.querySelector('link[data-ri-player-admin-modal]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='player-admin-modal.css';
    link.dataset.riPlayerAdminModal='1';
    document.head.appendChild(link);
  }

  if(!document.querySelector('script[data-ri-player-assists-ui]')){
    const script=document.createElement('script');
    script.type='module';
    script.src='js/player-assists-ui.js';
    script.dataset.riPlayerAssistsUi='1';
    document.body.appendChild(script);
  }
}

function loadVisualPolish(){
  if(!document.querySelector('link[data-ri-ui-polish]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='ui-polish-fixes.css';
    link.dataset.riUiPolish='1';
    document.head.appendChild(link);
  }

  if(!document.querySelector('script[data-ri-news-thumbnails]')){
    const script=document.createElement('script');
    script.type='module';
    script.src='js/news-card-thumbnails.js';
    script.dataset.riNewsThumbnails='1';
    document.body.appendChild(script);
  }
}

fixManifestHref();
cleanNode(document.body);
loadPlayerUiEnhancements();
loadVisualPolish();

new MutationObserver(mutations=>{
  for(const mutation of mutations){
    if(mutation.type==='characterData')cleanTextNode(mutation.target);
    for(const node of mutation.addedNodes)cleanNode(node);
  }
}).observe(document.body,{subtree:true,childList:true,characterData:true});
