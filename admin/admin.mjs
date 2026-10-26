const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const copy = value => structuredClone(value);
const sections = ['profile','projects','experiences','credentials','community','gallery','assets','releases'];
const labels = {profile:'Profile',projects:'Projects',experiences:'Experiences',credentials:'Credentials',community:'Community',gallery:'Gallery',assets:'Assets',releases:'Releases'};
const state = {csrf:null,user:null,entries:[],relationships:[],assets:[],releases:[],activeReleaseId:null,section:'profile',editing:null,dirty:false,relationshipsDirty:false,poll:null,busy:false,saving:false,assetChanges:new Set(),uploadDirty:false};
const text = (key,label,options={}) => ({key,label,type:'text',...options});
const long = (key,label,options={}) => text(key,label,{type:'textarea',...options});
const asset = (key,label,options={}) => text(key,label,{asset:true,...options});
const fields = {
  profile:[text('name','Display name',{required:true}),text('fullName','Full name'),text('role','Role'),long('intro','Introduction'),long('current','Current activity'),text('email','Contact email',{type:'email'}),asset('resume','Résumé file or URL',{external:true}),text('github','GitHub URL',{help:'Your GitHub profile URL. Public contributions refresh when previewing or publishing.'}),long('techStack','Tech stack',{type:'lines',help:'One technology per line, in display order. Leave blank to use tools from visible projects. Built-in logos: JavaScript, Python, FastAPI, Flask, PostgreSQL, Supabase, SQLite, Vercel. Other names display as text.'}),text('linkedin','LinkedIn URL'),asset('photo','Profile photo'),text('photoAlt','Photo alternative text'),text('photoCaption','Photo caption')],
  projects:[text('title','Title',{required:true}),text('kind','Project kind',{type:'select',choices:['deployed','recorded']}),text('role','Role'),long('purpose','Purpose'),long('contribution','Contribution'),long('tools','Tools',{type:'lines',help:'One tool per line.'}),text('url','Live site URL'),text('repositoryUrl','Repository URL'),text('videoUrl','External video URL',{help:'Use an external video URL. Video uploads are not supported.'}),asset('poster','Video poster'),text('mark','Short mark'),text('featureOrder','Featured order',{type:'number'}),long('stages','Workflow stages (JSON)',{type:'json',help:'Optional array of objects: title, detail (an array of strings), shortTitle, shortDetail. Leave blank for no stages.'})],
  experiences:[text('role','Role',{required:true}),text('organization','Organization',{required:true}),long('description','Description'),asset('logo','Logo'),text('startDate','Start date'),text('endDate','End date')],
  credentials:[text('name','Credential name',{required:true}),text('provider','Provider',{required:true}),asset('logo','Logo'),asset('url','Verification URL or certificate',{external:true}),text('linkLabel','Link label',{help:'Use “View certificate” for a document or “Verify” for issuer verification.'}),text('date','Date'),text('category','Category')],
  community:[text('category','Category',{type:'select',choices:['hackathons','leadership','organizations']}),text('role','Role',{required:true}),text('organization','Organization'),long('description','Description'),asset('logo','Logo'),text('startDate','Start date'),text('endDate','End date')],
  gallery:[text('title','Title',{required:true}),long('caption','Caption'),asset('image','Image'),text('alt','Image alternative text'),text('date','Date')],
};

function status(message, error=false) {
  $('#status').textContent = message;
  $('#status').dataset.state = error ? 'error' : 'normal';
}
function dirty(value=true) {
  state.dirty=value;
  const note=$('#unsaved-note');
  if(note) note.textContent=value?'Unsaved changes':'Draft is saved';
}
function allowLeave() {
  if(state.saving){status('Wait for the current save to finish.');return false;}
  return !state.dirty || window.confirm('Discard unsaved changes?');
}
window.addEventListener('beforeunload', event => { if(state.dirty) {event.preventDefault();event.returnValue='';} });
$('#public-link').addEventListener('click',event=>{if(!allowLeave())event.preventDefault();});

function showLogin(message='Sign in to manage the portfolio.') {
  state.csrf=null;
  $('#auth').hidden=false;
  $('#setup').hidden=true;
  $('#logout').hidden=true;
  $('#owner').textContent='Owner access';
  if(message)status(message,true);
}
async function api(path, options={}) {
  const headers = new Headers(options.headers);
  const method=options.method||'GET';
  if(options.body && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
  if(method!=='GET' && path!=='/api/admin/login') {
    if(!state.csrf)throw new Error('Sign in again before saving. Your entered values are still here.');
    headers.set('X-CSRF-Token',state.csrf);
  }
  let response;
  try {response=await fetch(path,{...options,headers,credentials:'same-origin',cache:'no-store'});}
  catch {throw new Error('Cannot reach the backend. Check the local server, then try again. Your entered values are still here.');}
  let result;
  try {result=await response.json();}catch {result={};}
  if(!response.ok) {
    if(response.status===401)showLogin('Your session expired. Sign in again; your unsaved values are still here.');
    const error=new Error(result.error?.message||`Request failed (${response.status}). Please try again.`);
    error.fields=result.error?.fields||{};error.status=response.status;throw error;
  }
  return result;
}
function updateHeader() {
  $('#auth').hidden=true;$('#setup').hidden=true;$('#authenticated').hidden=false;$('#logout').hidden=false;
  $('#owner').textContent=state.user?.email||'Signed in owner';
}
async function bootstrap() {
  status('Loading draft…');
  try {
    const result=await api('/api/admin/bootstrap');
    if(result.configured===false)throw new Error('The backend is not configured. Configure the local backend and owner account, then retry.');
    Object.assign(state,{csrf:result.csrf,user:result.user,entries:result.entries||[],relationships:result.relationships||[],assets:result.assets||[],releases:result.releases||[],activeReleaseId:result.activeReleaseId||null});
    updateHeader();renderNav();if(!state.dirty)renderView();
    status(state.dirty?'Signed in. Your unsaved changes are still open.':'Draft loaded. Changes stay private until you publish locally.');
    schedulePoll();
  }catch(error){
    if(error.status===401){showLogin('Sign in to manage the portfolio.');return;}
    $('#setup').hidden=false;$('#auth').hidden=true;$('#setup-message').textContent=error.message;
    if(!state.user)$('#authenticated').hidden=true;
    status('Admin is unavailable. No changes were saved.',true);
  }
}
$('#retry').addEventListener('click',bootstrap);
$('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;const button=$('button',form);button.disabled=true;
  clearErrors(form);$('#login-error').textContent='';
  try {
    const result=await api('/api/admin/login',{method:'POST',body:JSON.stringify({email:form.email.value,password:form.password.value})});
    state.csrf=result.csrf;state.user=result.user;form.password.value='';await bootstrap();
  }catch(error){showErrors(form,error);$('#login-error').textContent=error.message;}
  finally {button.disabled=false;}
});
$('#logout').addEventListener('click',async()=>{
  if(!allowLeave())return;
  try {await api('/api/admin/logout',{method:'POST'});clearTimeout(state.poll);state.user=null;state.editing=null;dirty(false);$('#authenticated').hidden=true;showLogin('You are signed out.');}
  catch(error){status(error.message,true);}
});

function renderNav() {
  $('#collections').innerHTML=sections.map(section=>`<button type="button" data-section="${section}"${state.section===section?' aria-current="page"':''}>${labels[section]}</button>`).join('');
}
$('#collections').addEventListener('click',event=>{
  const button=event.target.closest('[data-section]');if(!button||!allowLeave())return;
  state.section=button.dataset.section;state.editing=null;state.relationshipsDirty=false;state.assetChanges.clear();state.uploadDirty=false;dirty(false);renderNav();renderView();
});
function title(entry) {return entry.data?.title||entry.data?.name||entry.data?.organization||entry.data?.role||entry.id;}
function collectionEntries() {return state.entries.filter(entry=>entry.collection===state.section).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));}
function rowSummary(entry) {return [entry.id,entry.visible?'Visible':'Hidden',entry.sample?'Sample':null,entry.archived?'Archived':null,`Order ${entry.position}`].filter(Boolean).join(' · ');}
function renderView() {
  if(state.section==='assets'){renderAssets();return;}
  if(state.section==='releases'){renderReleases();return;}
  const entries=collectionEntries();
  $('#workspace').innerHTML=`<div class="section-header"><div><h2>${labels[state.section]}</h2><p>Edit draft content. Existing IDs stay fixed.</p></div>${state.section!=='profile'||!entries.length?'<button type="button" data-action="new">Add entry</button>':''}</div><ul class="entry-list">${state.editing?.isNew?`<li class="entry-row"><h3>New ${state.section==='profile'?'profile':'entry'}</h3>${editorHTML(state.editing.entry,true)}</li>`:''}${entries.map(entry=>`<li class="entry-row"><div class="row-heading"><div><h3 class="row-title">${esc(title(entry))}</h3><p class="row-meta">${esc(rowSummary(entry))}</p></div><button type="button" data-action="edit" data-id="${esc(entry.id)}">${state.editing?.entry.id===entry.id?'Editing':'Edit'}</button></div>${state.editing?.entry.id===entry.id&&!state.editing.isNew?editorHTML(state.editing.entry,false):''}</li>`).join('')}</ul>${!entries.length&&!state.editing?'<p class="empty">No entries yet. Add an entry to start this section.</p>':''}`;
  wireEditor();
}
function fieldHTML(field,data) {
  const name=`data.${field.key}`, id=`field-${field.key}`;
  let value=data[field.key];
  if(field.type==='lines')value=(value||[]).join('\n');
  if(field.type==='json')value=value?.length?JSON.stringify(value,null,2):'';
  const common=`id="${id}" name="${name}" aria-describedby="${id}-help ${id}-error"${field.required?' required':''}`;
  let control;
  if(field.type==='select')control=`<select ${common}>${field.choices.map(choice=>`<option value="${choice}"${value===choice?' selected':''}>${choice}</option>`).join('')}</select>`;
  else if(['textarea','lines','json'].includes(field.type))control=`<textarea ${common}${field.type==='json'?' class="code-input" spellcheck="false"':''}>${esc(value)}</textarea>`;
  else control=`<input ${common} type="${field.type}" value="${esc(value)}"${field.type==='number'?' step="1"':''}>`;
  const chooser=field.asset?`<div class="asset-picker"><select aria-label="Choose uploaded asset for ${esc(field.label)}" data-asset-for="${id}"><option value="">Choose an uploaded asset</option>${state.assets.filter(item=>!item.archived).map(item=>`<option value="asset:${esc(item.id)}">${esc(item.original_name)} (${item.visibility})</option>`).join('')}</select><button type="button" data-action="use-asset" data-target="${id}">Use asset</button></div>`:'';
  const help=field.help||(field.asset?`Enter an existing /assets/ path${field.external?', HTTP(S) URL':''}, or choose an uploaded asset. Uploaded assets must be public before publishing.`:'');
  return `<div class="field"><label for="${id}">${esc(field.label)}${field.required?' (required)':''}</label>${control}<p class="field-help" id="${id}-help">${esc(help)}</p>${chooser}<p class="field-error" id="${id}-error" data-error="${name}"></p></div>`;
}
function editorHTML(entry,isNew) {
  const project=state.section==='projects';
  return `<form id="entry-form" class="editor"><fieldset><legend>Entry settings</legend><div class="field-grid"><div class="field"><label for="entry-id">ID (required)</label><input id="entry-id" name="id" value="${esc(entry.id)}" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="80"${!isNew||state.section==='profile'?' readonly':''} aria-describedby="id-help id-error"><p id="id-help" class="field-help">Lowercase words separated by hyphens. The ID cannot change after saving.</p><p id="id-error" class="field-error" data-error="id"></p></div><div class="field"><label for="entry-position">Order</label><input id="entry-position" name="position" type="number" step="1" value="${entry.position}" required><p class="field-error" data-error="position"></p></div></div><div class="check-row">${[['visible','Visible'],['sample','Sample content'],['archived','Archived'],...(project?[['featured','Featured on home']]:[])].map(([key,label])=>`<label class="check-label"><input type="checkbox" name="${key}"${(key==='featured'?entry.data.featured:entry[key])?' checked':''}>${label}</label>`).join('')}</div>${project?'<p class="field-help">Choose up to three visible projects for Selected work.</p><p class="field-error" data-error="featured"></p>':''}</fieldset><fieldset><legend>Content</legend>${fields[state.section].map(field=>fieldHTML(field,entry.data)).join('')}</fieldset>${project?relationshipsHTML(entry):''}<p class="form-error" id="save-error" role="alert"></p><div class="form-actions"><button type="submit" class="primary">Save draft</button><button type="button" data-action="cancel">Cancel</button><span class="unsaved-note" id="unsaved-note">${isNew?'New entry — not saved':'Draft is saved'}</span></div></form>`;
}
function relationshipsHTML(entry) {
  const experiences=state.entries.filter(item=>item.collection==='experiences'&&!item.archived);
  const links=state.relationships.filter(link=>link.project_id===entry.id);
  // Keep links to archived experiences visible, so saving cannot silently discard them.
  for(const link of links){if(!experiences.some(item=>item.id===link.experience_id)){const old=state.entries.find(item=>item.collection==='experiences'&&item.id===link.experience_id);if(old)experiences.push(old);}}
  return `<fieldset id="relationships"><legend>Related experiences</legend><p class="field-help">Select all experiences this project belongs to. Connections update only when you change these controls and save.</p><div class="relationship-options">${experiences.map(item=>{const link=links.find(current=>current.experience_id===item.id);return `<div><label class="check-label"><input type="checkbox" name="relationship" value="${esc(item.id)}"${link?' checked':''}>${esc(title(item))}${item.archived?' (archived)':''}</label><label class="check-label relationship-sample"><input type="checkbox" name="relationship-sample" value="${esc(item.id)}"${link?.sample?' checked':''}>Sample connection</label></div>`;}).join('')}</div>${!experiences.length?'<p class="field-help">Add an experience first to create a connection.</p>':''}<p class="field-error" data-error="relationships"></p></fieldset>`;
}
function wireEditor() {
  const form=$('#entry-form');if(!form)return;
  form.addEventListener('input',event=>{dirty();if(event.target.closest('#relationships'))state.relationshipsDirty=true;});
  form.addEventListener('change',event=>{dirty();if(event.target.closest('#relationships'))state.relationshipsDirty=true;});
  form.addEventListener('submit',saveEntry);
}
function clearErrors(form) {
  form.querySelectorAll('.field-error,.form-error').forEach(node=>node.textContent='');
  form.querySelectorAll('[aria-invalid]').forEach(node=>node.removeAttribute('aria-invalid'));
}
function showErrors(form,error) {
  for(const [name,message] of Object.entries(error.fields||{})) {
    const path=name.replace(/^entry\./,'');
    const node=[...form.querySelectorAll('[data-error]')].find(item=>{const target=item.dataset.error.replace(/^data\./,'');const source=path.replace(/^data\./,'');return source===target||source.startsWith(target+'.');});
    if(node)node.textContent=Array.isArray(message)?message.join(', '):String(message);
    const input=form.elements.namedItem(path)||form.elements.namedItem(`data.${path}`)||form.elements.namedItem(node?.dataset.error||'');if(input?.setAttribute)input.setAttribute('aria-invalid','true');
  }
  const first=form.querySelector('[aria-invalid=true]');if(first)first.focus();
}
function readEntry(form) {
  const entry=copy(state.editing.entry);entry.id=form.elements.id.value.trim();entry.position=Number(form.elements.position.value);
  entry.visible=form.elements.visible.checked;entry.sample=form.elements.sample.checked;entry.archived=form.elements.archived.checked;
  for(const field of fields[state.section]) {
    const value=form.elements.namedItem(`data.${field.key}`).value.trim();
    if(field.type==='lines')entry.data[field.key]=value?value.split('\n').map(line=>line.trim()).filter(Boolean):[];
    else if(field.type==='json') {
      try {const stages=value?JSON.parse(value):[];if(!Array.isArray(stages))throw new Error();
        if(stages.some(stage=>!stage||typeof stage!=='object'||Array.isArray(stage)||typeof stage.title!=='string'||(stage.detail!==undefined&&(!Array.isArray(stage.detail)||stage.detail.some(item=>typeof item!=='string')))))throw new Error();
        entry.data[field.key]=stages;
      }catch {const error=new Error('Workflow stages must be a JSON array of stage objects with a title and optional detail string array.');error.fields={[`data.${field.key}`]:error.message};throw error;}
    } else if(field.type==='number')entry.data[field.key]=value?Number(value):0;
    else entry.data[field.key]=value||null;
  }
  if(state.section==='projects')entry.data.featured=form.elements.featured.checked;
  return entry;
}
async function saveEntry(event) {
  event.preventDefault();const form=event.currentTarget;clearErrors(form);
  if(!form.reportValidity())return;
  const button=$('[type=submit]',form);button.disabled=true;button.textContent='Saving…';state.saving=true;
  let contentSaved=false;
  try {
    const entry=readEntry(form);
    if(state.editing.isNew&&state.entries.some(item=>item.collection===state.section&&item.id===entry.id)){const error=new Error('This ID already exists. Choose another ID.');error.fields={id:error.message};throw error;}
    const result=await api(`/api/admin/content/${state.section}/${encodeURIComponent(entry.id)}`,{method:'PUT',body:JSON.stringify(entry)});
    const index=state.entries.findIndex(item=>item.collection===state.section&&item.id===entry.id);if(index<0)state.entries.push(result.entry);else state.entries[index]=result.entry;
    state.editing={entry:copy(result.entry),isNew:false};form.elements.id.readOnly=true;contentSaved=true;
    // This endpoint replaces the complete relationship set. Preserve every other project's links.
    if(state.section==='projects'&&state.relationshipsDirty) {
      const checked=[...form.querySelectorAll('[name=relationship]:checked')];
      const selected=checked.map(input=>({project_id:entry.id,experience_id:input.value,sample:[...form.querySelectorAll('[name=relationship-sample]:checked')].some(sample=>sample.value===input.value)}));
      const relationships=[...state.relationships.filter(link=>link.project_id!==entry.id),...selected];
      const linked=await api('/api/admin/relationships',{method:'PUT',body:JSON.stringify({relationships})});state.relationships=linked.relationships;
    }
    state.relationshipsDirty=false;dirty(false);renderView();status('Draft saved. Preview to review the result.');
  }catch(error){showErrors(form,error);$('#save-error',form).textContent=(contentSaved?'Content saved, but connections were not saved. Your selected connections are still here. ':'')+error.message;status('Changes need attention. Your entered values are still here.',true);}
  finally{state.saving=false;button.disabled=false;button.textContent='Save draft';}
}
$('#workspace').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='use-asset') {const input=document.getElementById(button.dataset.target);const select=$(`[data-asset-for="${button.dataset.target}"]`);if(select.value){input.value=select.value;dirty();}return;}
  if(action==='edit'||action==='new'||action==='cancel') {
    if(!allowLeave())return;dirty(false);state.relationshipsDirty=false;
    if(action==='cancel')state.editing=null;
    else if(action==='edit')state.editing={entry:copy(state.entries.find(entry=>entry.collection===state.section&&entry.id===button.dataset.id)),isNew:false};
    else {state.editing={isNew:true,entry:{collection:state.section,id:state.section==='profile'?'profile':'',data:{...(state.section==='projects'?{kind:'deployed',tools:[],stages:[],featured:false,featureOrder:0}:{}),...(state.section==='community'?{category:'hackathons'}:{})},position:collectionEntries().length,visible:true,sample:false,archived:false}};dirty();}
    renderView();if(action!=='cancel')$('#entry-form input')?.focus();return;
  }
  if(action==='asset-save'||action==='asset-archive')updateAsset(button);
  if(action==='activate')activateRelease(button);
});

function renderAssets() {
  $('#workspace').innerHTML=`<div class="section-header"><div><h2>Assets</h2><p>Upload originals, then choose them in content fields.</p></div></div><form class="upload-form" id="upload-form"><fieldset><legend>Upload a file</legend><div class="field"><label for="asset-upload">Image or PDF (required)</label><input id="asset-upload" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required><p class="field-help">JPEG, PNG or WebP up to 10 MB. PDF up to 20 MB. Videos use external URLs.</p><p class="field-error" data-error="file"></p></div><div class="field"><label for="upload-visibility">Visibility</label><select id="upload-visibility" name="visibility"><option value="private">Private — preview only</option><option value="public">Public — allow publishing</option></select><p class="field-help">Public assets may be copied into a published portfolio. Making an asset private does not remove it from previous releases.</p></div><p class="form-error" id="upload-error" role="alert"></p><button type="submit" class="primary">Upload asset</button></fieldset></form><ul class="asset-list">${state.assets.map(item=>`<li class="asset-row" data-asset="${esc(item.id)}"><div class="asset-body">${item.mime_type?.startsWith('image/')?`<img class="asset-preview" src="/api/admin/assets/${encodeURIComponent(item.id)}/file" alt="" loading="lazy">`:'<span class="asset-placeholder">PDF</span>'}<div><h3 class="row-title">${esc(item.original_name)}</h3><p class="row-meta">${esc(item.mime_type)} · ${formatBytes(item.size)} · ${item.archived?'Archived':'Available'}</p><p class="row-meta">asset:${esc(item.id)}</p><div class="asset-controls"><div class="field"><label for="visibility-${esc(item.id)}">Visibility</label><select id="visibility-${esc(item.id)}" data-visibility><option value="private"${item.visibility==='private'?' selected':''}>Private</option><option value="public"${item.visibility==='public'?' selected':''}>Public</option></select></div><button type="button" data-action="asset-save" data-id="${esc(item.id)}">Save visibility</button><button type="button" data-action="asset-archive" data-id="${esc(item.id)}">${item.archived?'Unarchive':'Archive'}</button><a class="asset-file" href="/api/admin/assets/${encodeURIComponent(item.id)}/file" target="_blank" rel="noopener">Open original</a></div><p class="form-error" data-asset-error role="alert"></p></div></div></li>`).join('')}</ul>${state.assets.length?'':'<p class="empty">No uploaded assets. Upload an image or PDF to use it in the portfolio.</p>'}`;
  const form=$('#upload-form');
  const markUpload=()=>{state.uploadDirty=true;dirty();};
  form.addEventListener('input',markUpload);form.addEventListener('change',markUpload);
  form.addEventListener('submit',async event=>{
    event.preventDefault();clearErrors(form);const file=form.elements.file.files[0];if(!file)return;
    const image=['image/jpeg','image/png','image/webp'].includes(file.type);const pdf=file.type==='application/pdf';
    if((!image&&!pdf)||file.size>(pdf?20:10)*1024*1024){$('#upload-error').textContent='Choose a supported image up to 10 MB or PDF up to 20 MB.';return;}
    const button=$('[type=submit]',form);button.disabled=true;button.textContent='Uploading…';state.saving=true;
    try {const body=new FormData();body.append('file',file);body.append('visibility',form.elements.visibility.value);const result=await api('/api/admin/assets',{method:'POST',body});state.assets.push(result.asset);state.uploadDirty=false;dirty(state.assetChanges.size>0);
      if(!state.dirty)renderAssets();else {form.reset();const row=document.createElement('li');row.className='asset-row';row.textContent=`Uploaded ${result.asset.original_name}. Finish the other changes, then reopen Assets to see it in the list.`;$('.asset-list').prepend(row);}
      status('Asset uploaded. Choose it in a content field to use it.');}
    catch(error){showErrors(form,error);$('#upload-error').textContent=error.message;status('Upload failed. Your selected file is still here.',true);}
    finally{state.saving=false;button.disabled=false;button.textContent='Upload asset';}
  });
  $('#workspace').querySelectorAll('[data-visibility]').forEach(select=>select.addEventListener('change',()=>{const row=select.closest('[data-asset]');const item=state.assets.find(asset=>asset.id===row.dataset.asset);if(select.value===item.visibility)state.assetChanges.delete(item.id);else state.assetChanges.add(item.id);dirty(state.uploadDirty||state.assetChanges.size>0);}));
}
function formatBytes(size) {const bytes=Number(size)||0;return bytes>=1024*1024?`${(bytes/1024/1024).toFixed(1)} MB`:`${Math.ceil(bytes/1024)} KB`;}
async function updateAsset(button) {
  if(state.saving){status('Wait for the current save to finish.');return;}
  const row=button.closest('[data-asset]');const item=state.assets.find(asset=>asset.id===button.dataset.id);button.disabled=true;state.saving=true;$('[data-asset-error]',row).textContent='';
  const patch=button.dataset.action==='asset-archive'?{archived:!item.archived}:{visibility:$('[data-visibility]',row).value};
  try {const result=await api(`/api/admin/assets/${encodeURIComponent(item.id)}`,{method:'PATCH',body:JSON.stringify(patch)});Object.assign(item,result.asset);if(patch.visibility)state.assetChanges.delete(item.id);dirty(state.uploadDirty||state.assetChanges.size>0);
    // Other asset rows or the upload form may still hold unsaved changes.
    if(!state.dirty){renderAssets();}else {button.textContent=button.dataset.action==='asset-archive'?(item.archived?'Unarchive':'Archive'):'Save visibility';status('Asset saved. Other unsaved changes remain open.');return;}
    status('Asset updated. Existing published releases stay unchanged.');
  }catch(error){$('[data-asset-error]',row).textContent=error.message;status(error.message,true);}finally{state.saving=false;button.disabled=false;}
}

function renderReleases() {
  $('#workspace').innerHTML=`<div class="section-header"><div><h2>Releases</h2><p>Restore a ready snapshot without changing the draft.</p></div><button type="button" id="refresh-releases">Refresh</button></div><ul class="release-list">${state.releases.map(release=>`<li class="release-row"><h3 class="row-title">${esc(release.id)}${state.activeReleaseId===release.id?' — Active':''}</h3><p class="row-meta">${esc(release.state)} · Created ${esc(formatDate(release.created_at))}${release.published_at?` · Published ${esc(formatDate(release.published_at))}`:''}</p>${release.error?`<p class="release-error">Build failed: ${esc(typeof release.error==='string'?release.error:JSON.stringify(release.error))}</p>`:''}${release.state==='ready'&&state.activeReleaseId!==release.id?`<div class="row-actions"><button type="button" data-action="activate" data-id="${esc(release.id)}">Restore this release</button></div>`:''}</li>`).join('')}</ul>${state.releases.length?'':'<p class="empty">No releases yet. Save the draft, review its preview, then publish locally.</p>'}`;
  $('#refresh-releases').addEventListener('click',()=>refreshReleases(true));
}
function formatDate(value) {if(!value)return 'time unavailable';const date=new Date(value);return Number.isNaN(date.valueOf())?value:date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}
async function refreshReleases(announce=false) {
  try {const previousBuilding=state.releases.filter(release=>release.state==='building').map(release=>release.id);const result=await api('/api/admin/releases');state.releases=result.releases||[];state.activeReleaseId=result.activeReleaseId||null;
    if(state.section==='releases')renderReleases();
    const building=state.releases.some(release=>release.state==='building');
    $('#publish').disabled=building||state.busy;$('#publish').textContent=building?'Publishing…':'Publish locally';
    const completed=state.releases.find(release=>previousBuilding.includes(release.id)&&release.state!=='building');
    if(completed)status(completed.state==='ready'?'Published locally. The ready release is now active.':`Publishing failed. The previous release remains active. ${completed.error||'Open Releases for details.'}`,completed.state==='failed');
    else if(announce)status('Release list refreshed.');schedulePoll();return result;
  }catch(error){status(error.message,true);clearTimeout(state.poll);}
}
function schedulePoll() {clearTimeout(state.poll);if(state.csrf&&state.releases.some(release=>release.state==='building'))state.poll=setTimeout(()=>refreshReleases(),2000);}
async function activateRelease(button) {
  if(!allowLeave())return;button.disabled=true;
  try {const result=await api(`/api/admin/releases/${encodeURIComponent(button.dataset.id)}/activate`,{method:'POST'});state.activeReleaseId=result.activeReleaseId;renderReleases();status('Release restored. The draft has not changed.');}
  catch(error){status(error.message,true);}finally{button.disabled=false;}
}
$('#preview').addEventListener('click',async()=>{
  if(state.dirty){status('Save or cancel your unsaved changes before previewing.',true);return;}
  const button=$('#preview');button.disabled=true;button.textContent='Building preview…';
  const previewWindow=window.open('about:blank','_blank');
  if(previewWindow){previewWindow.opener=null;previewWindow.document.title='Building portfolio preview';previewWindow.document.body.textContent='Building draft preview…';}
  try {const result=await api('/api/admin/preview',{method:'POST'});const url=new URL(result.url,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/admin/preview/'))throw new Error('The backend returned an invalid preview address.');
    if(previewWindow)previewWindow.location.replace(url.href);else {const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener';link.textContent='Open draft preview';$('#status').replaceChildren(document.createTextNode('Preview ready. '),link);return;}
    status('Draft preview opened in a new tab.');
  }catch(error){previewWindow?.close();status(error.message,true);}finally{button.disabled=false;button.textContent='Preview draft';}
});
$('#publish').addEventListener('click',async()=>{
  if(state.dirty){status('Save or cancel your unsaved changes before publishing.',true);return;}
  const button=$('#publish');state.busy=true;button.disabled=true;button.textContent='Publishing…';
  try {const result=await api('/api/admin/publish',{method:'POST'});state.releases=[result.release,...state.releases.filter(release=>release.id!==result.release.id)];
    status('Publishing locally. The current release stays active until the build succeeds.');if(state.section==='releases')renderReleases();schedulePoll();
  }catch(error){status(error.message,true);}finally{state.busy=false;button.disabled=state.releases.some(release=>release.state==='building');if(!button.disabled)button.textContent='Publish locally';}
});

await bootstrap();
