type ChatMessage = { role: 'user' | 'assistant'; text: string; fileName?: string };
type Attachment = { name: string; type: string; data: string };

const API_URL = 'https://boolean-logic-ai.yaswanth45.workers.dev';
const messages: ChatMessage[] = [{ role: 'assistant', text: 'Hi! I’m the AI Assistant for this Boolean Logic Toolkit. Ask me about Boolean algebra, K-maps, truth tables, digital logic, programming, or upload a question image.' }];
let attachment: Attachment | null = null;
let busy = false;

const style = document.createElement('style');
style.textContent = `
#ai-launcher{position:fixed;right:24px;bottom:24px;z-index:9998;border:1px solid rgba(34,211,238,.35);background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;border-radius:999px;padding:13px 18px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 18px 45px rgba(0,0,0,.35);cursor:pointer}
#ai-panel{position:fixed;right:24px;bottom:82px;width:min(520px,calc(100vw - 32px));height:min(720px,calc(100vh - 110px));z-index:9999;display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(148,163,184,.18);border-radius:24px;background:rgba(7,17,31,.98);color:#e7eef9;box-shadow:0 24px 80px rgba(0,0,0,.5);font:14px Inter,system-ui,sans-serif;backdrop-filter:blur(18px)}
#ai-panel.open{display:flex}
#ai-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.72)}
#ai-head strong{font-size:16px}.ai-sub{margin-top:3px;color:#64748b;font-size:11px}#ai-close{border:0;background:transparent;color:#94a3b8;font-size:22px;cursor:pointer}
#ai-messages{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.ai-msg{max-width:94%;padding:12px 14px;border-radius:16px;line-height:1.6;overflow-wrap:anywhere}.ai-user{align-self:flex-end;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.18);white-space:pre-wrap}.ai-assistant{align-self:flex-start;background:rgba(30,41,59,.7);border:1px solid rgba(148,163,184,.12)}
.ai-content{font-size:14px}.ai-content p{margin:0 0 10px}.ai-content p:last-child{margin-bottom:0}.ai-content h1,.ai-content h2,.ai-content h3{margin:16px 0 8px;line-height:1.3;color:#f1f5f9}.ai-content h1{font-size:19px}.ai-content h2{font-size:17px}.ai-content h3{font-size:15px}.ai-content strong{color:#f8fafc}.ai-content em{color:#cbd5e1}.ai-content ul,.ai-content ol{margin:7px 0 12px;padding-left:22px}.ai-content li{margin:4px 0}.ai-content code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;background:#0b1220;border:1px solid #263449;border-radius:6px;padding:2px 5px;color:#67e8f9}.ai-content pre{margin:10px 0;padding:12px;overflow:auto;border-radius:10px;background:#020617;border:1px solid #263449}.ai-content pre code{padding:0;border:0;background:transparent;color:#e2e8f0}.ai-content blockquote{margin:10px 0;padding:8px 12px;border-left:3px solid #22d3ee;background:rgba(34,211,238,.05);color:#cbd5e1}.ai-content hr{border:0;border-top:1px solid #334155;margin:15px 0}
.ai-table-wrap{width:100%;overflow-x:auto;margin:10px 0 13px;border:1px solid #334155;border-radius:10px}.ai-table{width:100%;min-width:300px;border-collapse:collapse;font-size:12.5px;background:#0b1424}.ai-table th{background:#172338;color:#f8fafc;font-weight:700;text-align:left}.ai-table th,.ai-table td{padding:8px 10px;border-bottom:1px solid #263449;border-right:1px solid #263449;white-space:nowrap}.ai-table tr:last-child td{border-bottom:0}.ai-table th:last-child,.ai-table td:last-child{border-right:0}.ai-table tr:nth-child(even) td{background:rgba(15,23,42,.45)}
.ai-math{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#a5f3fc;background:rgba(34,211,238,.06);border-radius:5px;padding:1px 5px}.ai-file{margin-top:7px;color:#67e8f9;font-size:11px}
#ai-attachment{display:none;padding:8px 14px;border-top:1px solid rgba(148,163,184,.1);color:#94a3b8;font-size:11px}#ai-compose{padding:10px;border-top:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.6)}#ai-input-row{display:flex;gap:8px;align-items:flex-end}#ai-input{flex:1;resize:none;min-height:46px;max-height:130px;border:1px solid #334155;border-radius:14px;background:#020617;color:#e2e8f0;padding:12px;outline:none;font:14px inherit}#ai-input:focus{border-color:#22d3ee}.ai-btn{height:44px;min-width:44px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer}.ai-btn:hover{border-color:#22d3ee;color:#67e8f9}.ai-btn:disabled{opacity:.45;cursor:not-allowed}#ai-send{background:#0891b2;border-color:#0891b2;color:white;font-weight:700}#ai-hint{padding:7px 3px 2px;color:#475569;font-size:10px}`;
document.head.appendChild(style);

const launcher = document.createElement('button'); launcher.id='ai-launcher'; launcher.textContent='✦ AI Assistant'; document.body.appendChild(launcher);
const panel = document.createElement('section'); panel.id='ai-panel'; panel.innerHTML=`<div id="ai-head"><div><strong>✦ AI Assistant</strong><div class="ai-sub">Free AI · Ask, learn, solve, or upload a question</div></div><button id="ai-close" aria-label="Close AI Assistant">×</button></div><div id="ai-messages"></div><div id="ai-attachment"></div><div id="ai-compose"><div id="ai-input-row"><input id="ai-file-input" type="file" accept="image/png,image/jpeg,image/webp" style="display:none"/><button class="ai-btn" id="ai-upload" title="Upload a question image">📎</button><textarea id="ai-input" placeholder="Ask anything…" rows="1"></textarea><button class="ai-btn" id="ai-send" title="Send">➤</button></div><div id="ai-hint">Free Cloudflare AI · Image questions supported · PDF support coming next</div></div>`; document.body.appendChild(panel);
const messagesEl=panel.querySelector<HTMLDivElement>('#ai-messages')!; const input=panel.querySelector<HTMLTextAreaElement>('#ai-input')!; const send=panel.querySelector<HTMLButtonElement>('#ai-send')!; const upload=panel.querySelector<HTMLButtonElement>('#ai-upload')!; const fileInput=panel.querySelector<HTMLInputElement>('#ai-file-input')!; const attachmentEl=panel.querySelector<HTMLDivElement>('#ai-attachment')!;

function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function inlineMarkdown(value:string){
  let s=escapeHtml(value);
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s=s.replace(/__([^_]+)__/g,'<strong>$1</strong>');
  s=s.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  s=s.replace(/_([^_]+)_/g,'<em>$1</em>');
  s=s.replace(/\$([^$\n]+)\$/g,'<span class="ai-math">$1</span>');
  return s;
}
function isTableSeparator(line:string){return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)}
function tableCells(line:string){let s=line.trim();if(s.startsWith('|'))s=s.slice(1);if(s.endsWith('|'))s=s.slice(0,-1);return s.split('|').map(x=>x.trim())}
function renderTable(lines:string[]){
  const head=tableCells(lines[0]);
  const rows=lines.slice(2).map(tableCells);
  let html='<div class="ai-table-wrap"><table class="ai-table"><thead><tr>';
  html+=head.map(c=>`<th>${inlineMarkdown(c)}</th>`).join('');
  html+='</tr></thead><tbody>';
  for(const row of rows){html+='<tr>'+head.map((_,i)=>`<td>${inlineMarkdown(row[i]||'')}</td>`).join('')+'</tr>'}
  return html+'</tbody></table></div>';
}
function renderMarkdown(markdown:string){
  const lines=markdown.replace(/\r/g,'').split('\n');
  const out:string[]=[]; let paragraph:string[]=[]; let listType:''|'ul'|'ol'=''; let inCode=false; let code:string[]=[];
  const flushParagraph=()=>{if(paragraph.length){out.push(`<p>${inlineMarkdown(paragraph.join('\n')).replace(/\n/g,'<br>')}</p>`);paragraph=[]}};
  const closeList=()=>{if(listType){out.push(listType==='ul'?'</ul>':'</ol>');listType=''}};
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(line.trim().startsWith('```')){if(inCode){out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);code=[];inCode=false}else{flushParagraph();closeList();inCode=true}continue}
    if(inCode){code.push(line);continue}
    if(i+1<lines.length && line.includes('|') && isTableSeparator(lines[i+1])){flushParagraph();closeList();const table=[line,lines[i+1]];i+=2;while(i<lines.length&&lines[i].includes('|')&&lines[i].trim())table.push(lines[i++]);i--;out.push(renderTable(table));continue}
    if(/^#{1,3}\s+/.test(line)){flushParagraph();closeList();const m=line.match(/^(#{1,3})\s+(.+)$/)!;const level=m[1].length;out.push(`<h${level}>${inlineMarkdown(m[2])}</h${level}>`);continue}
    if(/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)){flushParagraph();closeList();out.push('<hr>');continue}
    const ul=line.match(/^\s*[-*+]\s+(.+)$/); const ol=line.match(/^\s*\d+[.)]\s+(.+)$/);
    if(ul||ol){flushParagraph();const wanted=ul?'ul':'ol';if(listType!==wanted){closeList();out.push(`<${wanted}>`);listType=wanted}out.push(`<li>${inlineMarkdown((ul||ol)![1])}</li>`);continue}
    if(!line.trim()){flushParagraph();closeList();continue}
    closeList();paragraph.push(line);
  }
  if(inCode)out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);flushParagraph();closeList();
  return out.join('');
}
function render(){messagesEl.innerHTML='';for(const message of messages){const div=document.createElement('div');div.className=`ai-msg ${message.role==='user'?'ai-user':'ai-assistant'}`;if(message.role==='assistant'){const content=document.createElement('div');content.className='ai-content';content.innerHTML=renderMarkdown(message.text);div.appendChild(content)}else{div.textContent=message.text}if(message.fileName){const file=document.createElement('div');file.className='ai-file';file.textContent=`📎 ${message.fileName}`;div.appendChild(file)}messagesEl.appendChild(div)}messagesEl.scrollTop=messagesEl.scrollHeight}
function setBusy(value:boolean){busy=value;send.disabled=value;upload.disabled=value;input.disabled=value;send.textContent=value?'…':'➤'}
async function fileToData(file:File){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)})}
async function submit(){if(busy)return;const text=input.value.trim();if(!text&&!attachment)return;const current=attachment;const userText=text||'Please analyze the uploaded question image and explain it step by step.';const previousHistory=messages.slice(-10);messages.push({role:'user',text:userText,fileName:current?.name});input.value='';attachment=null;attachmentEl.style.display='none';render();setBusy(true);try{const response=await fetch(`${API_URL}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:userText,history:previousHistory,attachment:current})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);messages.push({role:'assistant',text:data.text||'I could not generate a response.'})}catch(error){messages.push({role:'assistant',text:`I couldn't reach the AI service. ${error instanceof Error?error.message:'Please try again.'}`})}finally{setBusy(false);render();input.focus()}}
launcher.addEventListener('click',()=>panel.classList.toggle('open'));panel.querySelector('#ai-close')!.addEventListener('click',()=>panel.classList.remove('open'));send.addEventListener('click',submit);input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submit()}});upload.addEventListener('click',()=>fileInput.click());fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];if(!file)return;if(file.size>12*1024*1024){attachmentEl.textContent='Image is too large. Please choose an image under 12 MB.';attachmentEl.style.display='block';fileInput.value='';return}attachment={name:file.name,type:file.type||'image/jpeg',data:await fileToData(file)};attachmentEl.textContent=`📎 ${file.name}`;attachmentEl.style.display='block'});render();
