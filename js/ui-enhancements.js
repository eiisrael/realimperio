import {state,saveData} from './state.js';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function migrateLegacyPositions(){
  let changed=false;
  for(const player of state.data.players||[]){
    if(player.position==='Outro'){
      player.position='Reserva';
      changed=true;
    }
  }
  if(changed)saveData();
}

function removeFoundation(root=document){
  $$('#view-team .info-list li',root).forEach(li=>{
    if(li.querySelector('span')?.textContent.trim()==='Fundação')li.remove();
  });

  const teamForm=$('#team-form',root);
  if(teamForm){
    const foundedField=$$('.field',teamForm).find(field=>field.querySelector('label')?.textContent.trim()==='Fundação');
    if(foundedField){
      const oldInput=foundedField.querySelector('[name="founded"]');
      if(oldInput&&!teamForm.querySelector('input[type="hidden"][name="founded"]')){
        const hidden=document.createElement('input');
        hidden.type='hidden';
        hidden.name='founded';
        hidden.value=oldInput.value||'';
        teamForm.appendChild(hidden);
      }
      foundedField.remove();
    }
  }
}

function removeImageUrlFields(root=document){
  $$('input[type="url"]',root).forEach(input=>{
    const field=input.closest('.field');
    const label=field?.querySelector('label')?.textContent||'';
    const looksLikeImage=/foto|imagem/i.test(label)||/photo|image/i.test(input.name||'');
    if(looksLikeImage)field?.remove();
  });
}

function replaceReservaOptions(root=document){
  $$('select[name="position"] option',root).forEach(option=>{
    if(option.value==='Outro'||option.textContent.trim()==='Outro'){
      option.value='Reserva';
      option.textContent='Reserva';
    }
  });
  $$('.player-position',root).forEach(el=>{
    if(el.textContent.trim()==='Outro')el.textContent='Reserva';
  });
  $$('.account-summary div',root).forEach(row=>{
    if(row.querySelector('dt')?.textContent.trim()==='Posição'&&row.querySelector('dd')?.textContent.trim()==='Outro'){
      row.querySelector('dd').textContent='Reserva';
    }
  });
}

function formatWhatsapp(value=''){
  const digits=String(value).replace(/\D/g,'').slice(0,11);
  if(!digits)return '';
  if(digits.length===1)return `(${digits}`;
  if(digits.length===2)return `(${digits})`;
  const ddd=digits.slice(0,2);
  const number=digits.slice(2);
  if(number.length<=5)return `(${ddd})${number}`;
  return `(${ddd})${number.slice(0,5)}-${number.slice(5,9)}`;
}

function whatsappInputs(root=document){
  const found=[];
  if(root instanceof HTMLInputElement&&root.name==='whatsapp')found.push(root);
  if(root?.querySelectorAll)found.push(...root.querySelectorAll('input[name="whatsapp"]'));
  return [...new Set(found)];
}

function setupWhatsappMasks(root=document){
  whatsappInputs(root).forEach(input=>{
    input.inputMode='tel';
    input.maxLength=14;
    input.autocomplete='tel';
    input.placeholder='(81)99876-5432';
    input.value=formatWhatsapp(input.value);
  });
}

function handleWhatsappInput(event){
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||input.name!=='whatsapp')return;
  input.value=formatWhatsapp(input.value);
}

function enforceRegistrationRules(root=document){
  let form=null;
  if(root instanceof HTMLFormElement&&root.id==='register-form')form=root;
  else if(root?.querySelector)form=root.querySelector('#register-form');
  if(!form)form=document.querySelector('#register-form');
  if(!form)return;

  const requiredNames=new Set(['name','email','password']);
  form.querySelectorAll('input,select,textarea').forEach(field=>{
    field.required=requiredNames.has(field.name);
  });

  const help=form.querySelector('.form-help');
  if(help)help.textContent='Após o envio, seu cadastro ficará pendente até a decisão de um administrador.';
}

function setupCoachPhotoPicker(root=document){
  let form=null;
  if(root instanceof HTMLFormElement&&root.id==='coach-form')form=root;
  else if(root?.querySelector)form=root.querySelector('#coach-form');
  if(!form)form=document.querySelector('#coach-form');
  if(!form)return;

  const card=form.closest('.coach-admin-card');
  const avatar=card?.querySelector('.coach-admin-avatar');
  const input=form.querySelector('input[name="photoFile"][type="file"]');
  if(!avatar||!input)return;

  input.id='coach-photo-file';
  const field=input.closest('.field');
  if(field)field.classList.add('coach-photo-input-hidden');

  avatar.classList.add('coach-photo-picker');
  avatar.setAttribute('role','button');
  avatar.setAttribute('tabindex','0');
  avatar.setAttribute('aria-label','Alterar foto do Técnico');
  avatar.setAttribute('title','Clique para alterar a foto');

  let overlay=avatar.querySelector('.coach-photo-overlay');
  if(!overlay){
    overlay=document.createElement('span');
    overlay.className='coach-photo-overlay';
    overlay.textContent='Alterar foto';
    avatar.appendChild(overlay);
  }

  avatar.onclick=()=>input.click();
  avatar.onkeydown=e=>{
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      input.click();
    }
  };
}

function cleanupUi(root=document){
  removeImageUrlFields(root);
  removeFoundation(root);
  replaceReservaOptions(root);
  setupWhatsappMasks(root);
  enforceRegistrationRules(root);
  setupCoachPhotoPicker(root);
}

function imageToCanvasFile(file){
  return new Promise((resolve,reject)=>{
    if(!file?.type?.startsWith('image/')){
      reject(new Error('Selecione um arquivo de imagem válido.'));
      return;
    }

    const objectUrl=URL.createObjectURL(file);
    const image=new Image();
    image.onload=()=>{
      URL.revokeObjectURL(objectUrl);
      openCropEditor(image,file.name).then(resolve,reject);
    };
    image.onerror=()=>{
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível abrir esta imagem.'));
    };
    image.src=objectUrl;
  });
}

function openCropEditor(image,originalName='foto.jpg'){
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.className='ri-crop-overlay';
    overlay.innerHTML=`
      <section class="ri-crop-card" role="dialog" aria-modal="true" aria-label="Ajustar imagem">
        <div class="ri-crop-heading">
          <div>
            <span>Ajuste de imagem</span>
            <h2>Zoom e enquadramento</h2>
            <p>Arraste a foto para posicioná-la e use o controle para aproximar ou afastar.</p>
          </div>
          <button type="button" class="ri-crop-close" aria-label="Cancelar">×</button>
        </div>
        <div class="ri-crop-stage">
          <canvas width="520" height="520"></canvas>
          <div class="ri-crop-guide" aria-hidden="true"></div>
        </div>
        <label class="ri-crop-zoom">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value="1" aria-label="Zoom da imagem">
        </label>
        <div class="ri-crop-actions">
          <button type="button" class="btn btn-dark ri-crop-cancel">Cancelar</button>
          <button type="button" class="btn btn-gold ri-crop-apply">Aplicar enquadramento</button>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    document.body.classList.add('ri-crop-open');

    const canvas=$('canvas',overlay),ctx=canvas.getContext('2d');
    const zoomInput=$('input[type="range"]',overlay);
    const size=canvas.width;
    const baseScale=Math.max(size/image.width,size/image.height);
    let zoom=1,offsetX=0,offsetY=0,dragging=false,lastX=0,lastY=0;

    const clampOffsets=()=>{
      const scale=baseScale*zoom;
      const renderedW=image.width*scale;
      const renderedH=image.height*scale;
      const maxX=Math.max(0,(renderedW-size)/2);
      const maxY=Math.max(0,(renderedH-size)/2);
      offsetX=Math.max(-maxX,Math.min(maxX,offsetX));
      offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
    };

    const render=()=>{
      clampOffsets();
      const scale=baseScale*zoom;
      const w=image.width*scale,h=image.height*scale;
      const x=(size-w)/2+offsetX,y=(size-h)/2+offsetY;
      ctx.clearRect(0,0,size,size);
      ctx.fillStyle='#090909';
      ctx.fillRect(0,0,size,size);
      ctx.drawImage(image,x,y,w,h);
    };

    const point=e=>{
      const rect=canvas.getBoundingClientRect();
      return {x:(e.clientX-rect.left)*(size/rect.width),y:(e.clientY-rect.top)*(size/rect.height)};
    };

    canvas.addEventListener('pointerdown',e=>{
      dragging=true;
      canvas.setPointerCapture(e.pointerId);
      const p=point(e);lastX=p.x;lastY=p.y;
      canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const p=point(e);
      offsetX+=p.x-lastX;
      offsetY+=p.y-lastY;
      lastX=p.x;lastY=p.y;
      render();
    });
    const stopDrag=e=>{
      dragging=false;
      canvas.classList.remove('is-dragging');
      try{canvas.releasePointerCapture(e.pointerId)}catch{}
    };
    canvas.addEventListener('pointerup',stopDrag);
    canvas.addEventListener('pointercancel',stopDrag);

    zoomInput.addEventListener('input',()=>{
      zoom=Number(zoomInput.value)||1;
      render();
    });

    const finish=result=>{
      document.body.classList.remove('ri-crop-open');
      overlay.remove();
      resolve(result);
    };
    $('.ri-crop-close',overlay).onclick=()=>finish(null);
    $('.ri-crop-cancel',overlay).onclick=()=>finish(null);
    overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});

    $('.ri-crop-apply',overlay).onclick=()=>{
      const output=document.createElement('canvas');
      output.width=900;output.height=900;
      const out=output.getContext('2d');
      const ratio=output.width/size;
      const scale=baseScale*zoom;
      const w=image.width*scale,h=image.height*scale;
      const x=(size-w)/2+offsetX,y=(size-h)/2+offsetY;
      out.fillStyle='#090909';
      out.fillRect(0,0,output.width,output.height);
      out.drawImage(image,x*ratio,y*ratio,w*ratio,h*ratio);
      output.toBlob(blob=>{
        if(!blob){finish(null);return}
        const cleanName=String(originalName||'foto').replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-')||'foto';
        finish(new File([blob],`${cleanName}-enquadrada.jpg`,{type:'image/jpeg',lastModified:Date.now()}));
      },'image/jpeg',.9);
    };

    render();
    requestAnimationFrame(()=>$('.ri-crop-card',overlay)?.focus?.());
  });
}

function previewEditedImage(input,file){
  const url=URL.createObjectURL(file);
  const form=input.closest('form');

  if(input.id==='player-photo-file'){
    const frame=$('.account-photo-frame');
    if(frame){
      let current=$('.account-profile-photo',frame);
      if(current?.tagName==='IMG')current.src=url;
      else{
        const img=document.createElement('img');
        img.className='account-profile-photo';
        img.src=url;
        img.alt='Prévia da nova foto';
        current?.replaceWith(img);
      }
    }
    const remove=$('input[name="removePhoto"]');
    if(remove)remove.checked=false;
    return;
  }

  if(form?.id==='player-admin-form'){
    let preview=$('.admin-player-preview',form);
    if(!preview){
      preview=document.createElement('div');
      preview.className='admin-player-preview';
      form.prepend(preview);
    }
    preview.innerHTML=`<img src="${url}" alt="Prévia da foto do jogador">`;
    const remove=$('input[name="removePhoto"]',form);
    if(remove)remove.checked=false;
    return;
  }

  if(form?.id==='coach-form'){
    const avatar=$('.coach-admin-avatar');
    if(avatar){
      avatar.innerHTML=`<img src="${url}" alt="Prévia da foto do Técnico">`;
      setupCoachPhotoPicker(document);
    }
    const remove=$('input[name="removePhoto"]',form);
    if(remove)remove.checked=false;
  }
}

async function handleImageSelection(event){
  const input=event.target;
  if(!(input instanceof HTMLInputElement))return;
  if(input.type!=='file'||!String(input.accept||'').includes('image'))return;
  if(input.dataset.riCropReady==='1'){
    delete input.dataset.riCropReady;
    return;
  }
  const file=input.files?.[0];
  if(!file)return;

  event.stopImmediatePropagation();
  try{
    const edited=await imageToCanvasFile(file);
    if(!edited){input.value='';return}
    const transfer=new DataTransfer();
    transfer.items.add(edited);
    input.files=transfer.files;
    previewEditedImage(input,edited);
    input.dataset.riCropReady='1';
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }catch(error){
    console.error(error);
    input.value='';
    alert(error.message||'Não foi possível ajustar a imagem.');
  }
}

migrateLegacyPositions();
cleanupUi();

document.addEventListener('input',handleWhatsappInput,true);
document.addEventListener('change',handleImageSelection,true);

const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===Node.ELEMENT_NODE)cleanupUi(node);
    }
  }
});
observer.observe(document.body,{childList:true,subtree:true});
