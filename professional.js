const emojiPattern=/[\p{Extended_Pictographic}\uFE0F]/gu;

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

cleanNode(document.body);

new MutationObserver(mutations=>{
  for(const mutation of mutations){
    if(mutation.type==='characterData')cleanTextNode(mutation.target);
    for(const node of mutation.addedNodes)cleanNode(node);
  }
}).observe(document.body,{subtree:true,childList:true,characterData:true});
