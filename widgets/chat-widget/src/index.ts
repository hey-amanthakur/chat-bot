interface ChatWidgetConfig {
  clientId: string;
  apiUrl: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class ChatWidget {
  private config: ChatWidgetConfig;
  private messages: Message[] = [];
  private container: HTMLDivElement | null = null;
  private isOpen = false;

  constructor(config: ChatWidgetConfig) {
    this.config = {
      position: 'bottom-right',
      theme: 'light',
      ...config,
    };
    this.init();
  }

  private init() {
    this.createStyles();
    this.createWidget();
    this.attachEventListeners();
  }

  private createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .chat-widget-bubble {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
        bottom: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .chat-widget-container {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
        bottom: 90px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        z-index: 9998;
        overflow: hidden;
      }
      .chat-widget-container.open {
        display: flex;
      }
      .chat-widget-header {
        background: #007bff;
        color: white;
        padding: 16px;
        font-weight: 600;
      }
      .chat-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .chat-widget-input {
        display: flex;
        padding: 12px;
        border-top: 1px solid #eee;
      }
      .chat-widget-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
      }
      .chat-widget-input button {
        margin-left: 8px;
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
      }
      .chat-message {
        margin-bottom: 12px;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
      }
      .chat-message.user {
        background: #007bff;
        color: white;
        margin-left: auto;
      }
      .chat-message.assistant {
        background: #f1f1f1;
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  private createWidget() {
    this.container = document.createElement('div');
    this.container.innerHTML = `
      <button class="chat-widget-bubble">💬</button>
      <div class="chat-widget-container">
        <div class="chat-widget-header">Chat with us</div>
        <div class="chat-widget-messages"></div>
        <div class="chat-widget-input">
          <input type="text" placeholder="Type your message..." />
          <button>Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
  }

  private attachEventListeners() {
    const bubble = this.container?.querySelector('.chat-widget-bubble');
    const widget = this.container?.querySelector('.chat-widget-container');
    const input = this.container?.querySelector('input');
    const sendButton = this.container?.querySelector('button:not(.chat-widget-bubble)');

    bubble?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      widget?.classList.toggle('open', this.isOpen);
    });

    sendButton?.addEventListener('click', () => this.sendMessage(input as HTMLInputElement));
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage(input as HTMLInputElement);
    });
  }

  private async sendMessage(input: HTMLInputElement) {
    const message = input.value.trim();
    if (!message) return;

    this.addMessage({ role: 'user', content: message, timestamp: new Date() });
    input.value = '';

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
      const data = await response.json();
      this.addMessage({ role: 'assistant', content: data.response, timestamp: new Date() });
    } catch (error) {
      this.addMessage({
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      });
    }
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    const messagesContainer = this.container?.querySelector('.chat-widget-messages');
    if (messagesContainer) {
      const div = document.createElement('div');
      div.className = `chat-message ${message.role}`;
      div.textContent = message.content;
      messagesContainer.appendChild(div);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('chat-session-id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('chat-session-id', sessionId);
    }
    return sessionId;
  }
}

export default ChatWidget;
