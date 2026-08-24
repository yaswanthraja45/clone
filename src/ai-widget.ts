type ChatMessage = { role: 'user' | 'assistant'; text: string; fileName?: string };

type Attachment = {
  name: string;
  type: string;
  data: string;
};

const messages: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Hi! I’m the AI Assistant for this Boolean Logic Toolkit. Ask me about Boolean algebra, K-maps, truth tables, digital logic, programming, or upload a question.',
  },
];

let attachment: Attachment | null = null;
let busy = false;

const style = document.createElement('style');
style.textContent = `
#ai-launcher{position:fixed;right:24px;bottom:24px;z-index:9998;border:1px solid rgba(34,211,238,.35);background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;border-radius:999px;padding:13px 18px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 18px 45px rgba(0,0,0,.35);cursor:pointer}
#ai-panel{position:fixed;right:24px;bottom:82px;width:min(440px,calc(100vw - 32px));height:min(680px,calc(100vh - 110px));z-index:9999;display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(148,163,184,.18);border-radius:24px;background:rgba(7,17,31,.97);color:#e7eef9;box-shadow:0 24px 80px rgba(0,0,0,.5);font:14px Inter,system-ui,sans-serif;backdrop-filter:blur(18px)}
#ai-panel.open{display:flex}
#ai-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.72)}
#ai-head strong{font-size:16px}.ai-sub{margin-top:3px;color:#64748b;font-size:11px}
#ai-close{border:0;background:transparent;color:#94a3b8;font-size:22px;cursor:pointer}
#ai-messages{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.ai-msg{max-width:88%;padding:11px 13px;border-radius:16px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.ai-user{align-self:flex-end;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.18)}
.ai-assistant{align-self:flex-start;background:rgba(30,41,59,.7);border:1px solid rgba(148,163,184,.12)}
.ai-file{margin-top:7px;color:#67e8f9;font-size:11px}
#ai-attachment{display:none;padding:8px 14px;border-top:1px solid rgba(148,163,184,.1);color:#94a3b8;font-size:11px}
#ai-compose{padding:10px;border-top:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.6)}
#ai-input-row{display:flex;gap:8px;align-items:flex-end}
#ai-input{flex:1;resize:none;min-height:46px;max-height:130px;border:1px solid #334155;border-radius:14px;background:#020617;color:#e2e8f0;padding:12px;outline:none;font:14px inherit}
#ai-input:focus{border-color:#22d3ee}
.ai-btn{height:44px;min-width:44px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer}.ai-btn:hover{border-color:#22d3ee;color:#67e8f9}.ai-btn:disabled{opacity:.45;cursor:not-allowed}
#ai-send{background:#0891b2;border-color:#0891b2;color:white;font-weight:700}
#ai-hint{padding:7px 3px 2px;color:#475569;font-size:10px}
`;
document.head.appendChild(style);

const launcher = document.createElement('button');
launcher.id = 'ai-launcher';
launcher.textContent = '✦ AI Assistant';
document.body.appendChild(launcher);

const panel = document.createElement('section');
panel.id = 'ai-panel';
panel.innerHTML = `
  <div id="ai-head">
    <div><strong>✦ AI Assistant</strong><div class="ai-sub">Ask, learn, solve, or upload a question</div></div>
    <button id="ai-close" aria-label="Close AI Assistant">×</button>
  </div>
  <div id="ai-messages"></div>
  <div id="ai-attachment"></div>
  <div id="ai-compose">
    <div id="ai-input-row">
      <input id="ai-file-input" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.txt,.md" style="display:none" />
      <button class="ai-btn" id="ai-upload" title="Upload an image or PDF">📎</button>
      <textarea id="ai-input" placeholder="Ask anything…" rows="1"></textarea>
      <button class="ai-btn" id="ai-send" title="Send">➤</button>
    </div>
    <div id="ai-hint">Images and PDFs can be attached. Never put your OpenAI API key in frontend code.</div>
  </div>
`;
document.body.appendChild(panel);

const messagesEl = panel.querySelector<HTMLDivElement>('#ai-messages')!;
const input = panel.querySelector<HTMLTextAreaElement>('#ai-input')!;
const send = panel.querySelector<HTMLButtonElement>('#ai-send')!;
const upload = panel.querySelector<HTMLButtonElement>('#ai-upload')!;
const fileInput = panel.querySelector<HTMLInputElement>('#ai-file-input')!;
const attachmentEl = panel.querySelector<HTMLDivElement>('#ai-attachment')!;

function render() {
  messagesEl.innerHTML = '';
  for (const message of messages) {
    const div = document.createElement('div');
    div.className = `ai-msg ${message.role === 'user' ? 'ai-user' : 'ai-assistant'}`;
    div.textContent = message.text;
    if (message.fileName) {
      const file = document.createElement('div');
      file.className = 'ai-file';
      file.textContent = `📎 ${message.fileName}`;
      div.appendChild(file);
    }
    messagesEl.appendChild(div);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setBusy(value: boolean) {
  busy = value;
  send.disabled = value;
  upload.disabled = value;
  input.disabled = value;
  send.textContent = value ? '…' : '➤';
}

async function fileToData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submit() {
  if (busy) return;
  const text = input.value.trim();
  if (!text && !attachment) return;

  const current = attachment;
  messages.push({
    role: 'user',
    text: text || 'Please analyze the uploaded file.',
    fileName: current?.name,
  });
  input.value = '';
  attachment = null;
  attachmentEl.style.display = 'none';
  render();
  setBusy(true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text || 'Please analyze the uploaded file and explain it step by step.',
        history: messages.slice(-12),
        attachment: current,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    messages.push({ role: 'assistant', text: data.text || 'I could not generate a response.' });
  } catch (error) {
    messages.push({
      role: 'assistant',
      text: `I couldn't reach the AI service. ${error instanceof Error ? error.message : 'Please try again.'}`,
    });
  } finally {
    setBusy(false);
    render();
    input.focus();
  }
}

launcher.addEventListener('click', () => panel.classList.toggle('open'));
panel.querySelector('#ai-close')!.addEventListener('click', () => panel.classList.remove('open'));
send.addEventListener('click', submit);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
});
upload.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > 12 * 1024 * 1024) {
    attachmentEl.textContent = 'File is too large. Please choose a file under 12 MB.';
    attachmentEl.style.display = 'block';
    fileInput.value = '';
    return;
  }
  attachment = { name: file.name, type: file.type || 'application/octet-stream', data: await fileToData(file) };
  attachmentEl.textContent = `📎 ${file.name}`;
  attachmentEl.style.display = 'block';
});

render();
