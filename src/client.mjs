import {answerQuestion} from './assistant.mjs';

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
