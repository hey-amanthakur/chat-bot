interface ChatWidgetConfig {
  clientId: string;
  apiUrl: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  theme?: 'light' | 'dark';
  primaryColor?: string;
  greeting?: string;
  headerTitle?: string;
  icon?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const DEFAULT_ICON = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

class ChatWidget {
  private config: ChatWidgetConfig;
  private messages: Message[] = [];
  private container: HTMLDivElement | null = null;
  private isOpen = false;
  private isLoading = false;

  constructor(config: ChatWidgetConfig) {
    this.config = {
      position: 'bottom-right',
      theme: 'light',
      primaryColor: '#2563eb',
      headerTitle: 'Chat with us',
      ...config,
    };
    this.init();
  }

  private init() {
    this.createStyles();
    this.createWidget();
    this.attachEventListeners();
  }

  private renderIcon(): string {
    const icon = this.config.icon;
    if (!icon) return DEFAULT_ICON;
    if (icon.startsWith('<svg')) return icon;
    if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
      return `<img src="${icon}" alt="Chat" width="28" height="28" style="object-fit:contain;" />`;
    }
    return `<span style="font-size:28px;line-height:1;">${icon}</span>`;
  }

  private createStyles() {
    const pos = this.config.position || 'bottom-right';
    const isLeft = pos.includes('left');
    const isTop = pos.includes('top');
    const horizontal = isLeft ? 'left: 20px' : 'right: 20px';
    const bubbleVertical = isTop ? 'top: 20px' : 'bottom: 20px';
    const containerVertical = isTop ? 'top: 90px' : 'bottom: 90px';
    const color = this.config.primaryColor;

    const style = document.createElement('style');
    style.textContent = `
      .cw-bubble {
        position: fixed;
        ${horizontal};
        ${bubbleVertical};
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${color};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 2147483647;
        font-size: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .cw-bubble:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      }
      .cw-container {
        position: fixed;
        ${horizontal};
        ${containerVertical};
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 520px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.18);
        display: none;
        flex-direction: column;
        z-index: 2147483646;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .cw-container.cw-open { display: flex; }
      .cw-header {
        background: ${color};
        color: white;
        padding: 18px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .cw-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .cw-header-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cw-header-icon img {
        width: 16px;
        height: 16px;
        object-fit: contain;
      }
      .cw-header-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.8;
      }
      .cw-header-close:hover { opacity: 1; }
      .cw-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .cw-msg {
        padding: 10px 14px;
        border-radius: 12px;
        max-width: 85%;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .cw-msg-user {
        background: ${color};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .cw-msg-bot {
        background: #f1f5f9;
        color: #1e293b;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .cw-msg-bot.cw-loading::after {
        content: '';
        display: inline-block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #94a3b8;
        margin-left: 4px;
        animation: cw-blink 1.2s infinite;
      }
      @keyframes cw-blink {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
      }
      .cw-input-bar {
        display: flex;
        padding: 12px 16px;
        border-top: 1px solid #e2e8f0;
        gap: 8px;
      }
      .cw-input-bar input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        outline: none;
        font-size: 14px;
        font-family: inherit;
      }
      .cw-input-bar input:focus { border-color: ${color}; }
      .cw-input-bar button {
        padding: 10px 20px;
        background: ${color};
        color: white;
        border: none;
        border-radius: 24px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .cw-input-bar button:hover { opacity: 0.9; }
      .cw-input-bar button:disabled { opacity: 0.5; cursor: not-allowed; }
      .cw-msg-bot ul {
        margin: 6px 0;
        padding-left: 20px;
      }
      .cw-msg-bot li {
        margin: 3px 0;
      }
      .cw-msg-bot strong {
        font-weight: 600;
      }
      @media (max-width: 480px) {
        .cw-container {
          width: calc(100vw - 20px);
          height: calc(100vh - 100px);
          ${isTop ? 'top: 80px' : 'bottom: 80px'};
          border-radius: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createWidget() {
    const headerIcon = this.config.icon
      ? `<span class="cw-header-icon">${this.renderIcon()}</span>`
      : '';

    this.container = document.createElement('div');
    this.container.innerHTML = `
      <button class="cw-bubble" aria-label="Open chat">
        ${this.renderIcon()}
      </button>
      <div class="cw-container">
        <div class="cw-header">
          <span class="cw-header-title">
            ${headerIcon}
            ${this.config.headerTitle}
          </span>
          <button class="cw-header-close" aria-label="Close chat">&times;</button>
        </div>
        <div class="cw-messages"></div>
        <div class="cw-input-bar">
          <input type="text" placeholder="Type your message..." />
          <button>Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);

    if (this.config.greeting) {
      this.addBotMessage(this.config.greeting);
    }
  }

  private attachEventListeners() {
    const bubble = this.container!.querySelector('.cw-bubble')!;
    const widget = this.container!.querySelector('.cw-container')!;
    const closeBtn = this.container!.querySelector('.cw-header-close')!;
    const input = this.container!.querySelector('input')!;
    const sendBtn = this.container!.querySelector('.cw-input-bar button')!;

    bubble.addEventListener('click', () => {
      this.isOpen = true;
      widget.classList.add('cw-open');
      input.focus();
    });

    closeBtn.addEventListener('click', () => {
      this.isOpen = false;
      widget.classList.remove('cw-open');
    });

    sendBtn.addEventListener('click', () => this.handleSend(input as HTMLInputElement));

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend(input as HTMLInputElement);
    });
  }

  private async handleSend(input: HTMLInputElement) {
    const message = input.value.trim();
    if (!message || this.isLoading) return;

    this.addUserMessage(message);
    input.value = '';

    this.isLoading = true;
    const loadingEl = this.addBotMessage('...');
    loadingEl.classList.add('cw-loading');

    const sendBtn = this.container!.querySelector('.cw-input-bar button')! as HTMLButtonElement;
    sendBtn.disabled = true;

    try {
      const response = await fetch(`${this.config.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.config.clientId,
          message,
          sessionId: this.getSessionId(),
        }),
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      loadingEl.classList.remove('cw-loading');
      loadingEl.innerHTML = this.parseMarkdown(data.response);

      if (data.lead_captured) {
        this.addBotMessage('Please share your details and we will reach out to you soon!');
      }
    } catch (error) {
      loadingEl.classList.remove('cw-loading');
      loadingEl.textContent = 'Sorry, something went wrong. Please try again.';
    } finally {
      this.isLoading = false;
      sendBtn.disabled = false;
    }
  }

  private addUserMessage(content: string) {
    this.messages.push({ role: 'user', content, timestamp: new Date() });
    const messagesEl = this.container!.querySelector('.cw-messages')!;
    const div = document.createElement('div');
    div.className = 'cw-msg cw-msg-user';
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  private parseMarkdown(text: string): string {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    const lines = html.split('\n');
    let result = '';
    let inList = false;

    for (const line of lines) {
      const listMatch = line.match(/^[-*]\s+(.*)/);
      if (listMatch) {
        if (!inList) { result += '<ul>'; inList = true; }
        result += `<li>${listMatch[1]}</li>`;
      } else {
        if (inList) { result += '</ul>'; inList = false; }
        result += line + '<br>';
      }
    }
    if (inList) result += '</ul>';
    return result.replace(/<br>$/, '');
  }

  private addBotMessage(content: string): HTMLDivElement {
    this.messages.push({ role: 'assistant', content, timestamp: new Date() });
    const messagesEl = this.container!.querySelector('.cw-messages')!;
    const div = document.createElement('div');
    div.className = 'cw-msg cw-msg-bot';
    div.innerHTML = this.parseMarkdown(content);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('cw-sid');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('cw-sid', sessionId);
    }
    return sessionId;
  }
}

// Auto-init from script tag data attributes
(function () {
  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const config: ChatWidgetConfig = {
      clientId: script.getAttribute('data-client-id') || '',
      apiUrl: script.getAttribute('data-api-url') || 'http://localhost:3000',
      position: (script.getAttribute('data-position') as any) || 'bottom-right',
      primaryColor: script.getAttribute('data-color') || '#2563eb',
      greeting: script.getAttribute('data-greeting') || undefined,
      headerTitle: script.getAttribute('data-header') || undefined,
      icon: script.getAttribute('data-icon') || undefined,
    };
    if (config.clientId) {
      new ChatWidget(config);
    }
  }
})();

export default ChatWidget;
