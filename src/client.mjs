import {answerQuestion} from './assistant.mjs';
import {selectProject,videoSource,safeExternalUrl} from './media.mjs';

const siteBase=(()=>{try{return JSON.parse(document.getElementById('assistant-data')?.textContent||'{}').basePath||'/';}catch{return '/';}})();
const iconPath=siteBase.replace(/\/$/,'')+'/assets/arrow-right.svg';
function appendArrow(link){const img=document.createElement('img');img.className='icon';img.src=iconPath;img.alt='';img.width=14;img.height=14;img.setAttribute('aria-hidden','true');link.append(img);}

function keyboardTabs(container,buttons,choose){
  container.addEventListener('keydown',event=>{
    const current=buttons.indexOf(event.target);if(current<0)return;
    let next=current;
    if((event.key==='ArrowRight'||event.key==='ArrowDown'))next=(current+1)%buttons.length;
    else if((event.key==='ArrowLeft'||event.key==='ArrowUp'))next=(current-1+buttons.length)%buttons.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=buttons.length-1;
    else return;
    event.preventDefault();choose(buttons[next]);buttons[next].focus();
  });
}
function selectTab(buttons,selected){for(const button of buttons){const active=button===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}}

const folio=document.querySelector('[data-folio]');
if(folio){
  const buttons=[...folio.querySelectorAll('[data-folio-tab]')];
  const choose=button=>{selectTab(buttons,button);let order=0;for(const tab of buttons){tab.dataset.sheetOrder=String(tab===button?buttons.length-1:order++);tab.querySelector('.sheet-action').firstChild.textContent=tab===button?'Selected ':'View project ';}for(const panel of folio.querySelectorAll('[role=tabpanel]'))panel.hidden=panel.id!==`folio-${button.dataset.folioTab}`;};
  for(const button of buttons)button.addEventListener('click',()=>choose(button));
  keyboardTabs(folio.querySelector('[role=tablist]'),buttons,choose);
}

const dataElement=document.getElementById('recorded-data');
if(dataElement){
  const projects=JSON.parse(dataElement.textContent),tabs=document.querySelector('.demo-tabs'),buttons=[...tabs.querySelectorAll('[data-demo-tab]')],panel=document.getElementById('demo-panel'),player=document.getElementById('demo-player');
  const initialPlaceholder=player.firstElementChild.cloneNode(true);let current=projects[0];
  function updateLinks(item){const links=document.querySelector('.demo-links');links.replaceChildren();const entries=[];if(videoSource(item.videoUrl)?.type==='youtube')entries.push(['Watch on YouTube',item.videoUrl]);entries.push(['View code',item.repositoryUrl]);for(const[label,value]of entries){const href=safeExternalUrl(value);if(!href)continue;const a=document.createElement('a');a.className='text-link';a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.append(document.createTextNode(label));const img=document.createElement('img');img.src=iconPath;img.width=14;img.height=14;img.alt='';img.className='icon';img.setAttribute('aria-hidden','true');a.append(img);links.append(a);}}
  function choose(button,updateHash=true){
    current=selectProject(projects,button.dataset.demoTab);selectTab(buttons,button);panel.setAttribute('aria-labelledby',button.id);player.replaceChildren(initialPlaceholder.cloneNode(true));const source=videoSource(current.videoUrl);
    player.querySelector('[data-player-title]').textContent=current.title;
    player.querySelector('[data-preview-status]').textContent=source?'Video preview':'Video preview pending';
    const play=player.querySelector('[data-play-demo]');play.disabled=!source;play.lastElementChild.textContent=source?'Play demo':'Demo coming soon';play.setAttribute('aria-label',source?`Play ${current.title} demo`:`${current.title} video has not been added`);
    document.getElementById('demo-title').textContent=current.title;document.querySelector('.demo-purpose').textContent=current.purpose;document.querySelector('.demo-contribution').textContent=current.contribution||'';updateLinks(current);
    if(updateHash){history.replaceState(null,'',`#${current.id}`);if(tabs.scrollWidth>tabs.clientWidth)button.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
  }
  for(const button of buttons)button.addEventListener('click',()=>choose(button));
  keyboardTabs(tabs,buttons,choose);
  player.addEventListener('click',event=>{
    if(!event.target.closest('[data-play-demo]'))return;const source=videoSource(current.videoUrl);if(!source)return;
    if(source.type==='youtube'){const frame=document.createElement('iframe');frame.src=source.src+'?autoplay=1&rel=0';frame.title=`${current.title} demo`;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';player.replaceChildren(frame);frame.focus();}
    else{const video=document.createElement('video');video.src=source.src;video.controls=true;video.playsInline=true;video.autoplay=true;video.setAttribute('aria-label',`${current.title} demo`);if(current.poster)video.poster=current.poster;player.replaceChildren(video);video.play().catch(()=>{video.focus();});}
  });
  const hash=location.hash.slice(1),initial=buttons.find(b=>b.dataset.demoTab===hash)||buttons[0];choose(initial,false);
  if(projects.some(p=>p.id===hash))requestAnimationFrame(()=>document.getElementById('recorded-work').scrollIntoView({block:'start',behavior:'instant'}));
  window.addEventListener('hashchange',()=>{const button=buttons.find(b=>b.dataset.demoTab===location.hash.slice(1));if(button)choose(button,false);});
}


// Native dialogs retain keyboard focus, support Escape, and return to the opener.
const dialogOpeners=new WeakMap();
function openDialog(dialog,opener){
  for(const other of document.querySelectorAll('dialog[open]'))other.close();
  dialogOpeners.set(dialog,opener.closest('dialog')?document.querySelector('.chat-launcher'):opener);
  dialog.showModal();
}
for(const button of document.querySelectorAll('[data-dialog-open]'))button.addEventListener('click',()=>openDialog(document.getElementById(button.dataset.dialogOpen),button));
for(const dialog of document.querySelectorAll('dialog')){
  dialog.querySelector('[data-dialog-close]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>dialogOpeners.get(dialog)?.focus());
}
const navigationDialog=document.getElementById('mobile-navigation');
matchMedia('(min-width:1025px)').addEventListener('change',event=>{if(event.matches&&navigationDialog?.open)navigationDialog.close();});

const viewer=document.getElementById('gallery-viewer');
if(viewer)for(const button of document.querySelectorAll('[data-gallery-open]'))button.addEventListener('click',()=>{
  viewer.querySelector('img').src=button.dataset.galleryOpen;
  viewer.querySelector('img').alt=button.querySelector('img').alt;
  document.getElementById('gallery-caption').textContent=button.dataset.galleryCaption;
  openDialog(viewer,button);
});

const chat=document.getElementById('portfolio-chat');
if(chat){
  const content=JSON.parse(document.getElementById('assistant-data').textContent),input=chat.querySelector('input'),form=chat.querySelector('form'),send=chat.querySelector('[type=submit]'),messages=chat.querySelector('.chat-messages');
  for(const button of document.querySelectorAll('[data-chat-open]'))button.addEventListener('click',()=>{openDialog(chat,button);input.focus();});
  function appendMessage(author,text,links=[]){
    const message=document.createElement('div');message.className='chat-message '+(author==='You'?'visitor-message':'guide-message');
    const label=document.createElement('p');label.className='message-author';label.textContent=author;
    const body=document.createElement('p');body.textContent=text;message.append(label,body);
    if(links.length){const list=document.createElement('div');list.className='chat-answer-links';for(const item of links){
      if(!/^\/(?!\/)|^mailto:/.test(item.href))continue;
      const a=document.createElement('a');a.className='text-link';a.href=item.href;a.textContent=item.label;appendArrow(a);list.append(a);
    }message.append(list);}
    messages.append(message);messages.scrollTop=messages.scrollHeight;
  }
  function submitQuestion(value){
    const question=String(value).trim().slice(0,500),answer=answerQuestion(question,content);if(!answer)return;
    appendMessage('You',question);appendMessage('Portfolio guide',answer.text,answer.links);input.value='';send.disabled=true;input.focus();
  }
  input.addEventListener('input',()=>send.disabled=!input.value.trim());
  form.addEventListener('submit',event=>{event.preventDefault();submitQuestion(input.value);});
  for(const button of chat.querySelectorAll('[data-chat-question]'))button.addEventListener('click',()=>submitQuestion(button.dataset.chatQuestion));
}
