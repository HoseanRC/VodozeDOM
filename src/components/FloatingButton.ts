export class FloatingButton {
  private button: HTMLElement;
  private panel: HTMLElement;
  private isVisible = false;

  constructor() {
    this.button = this.createButton();
    this.panel = this.createPanel();
    this.injectStyles();
    this.attachEventListeners();
  }

  private createButton(): HTMLElement {
    const button = document.createElement('div');
    button.id = 'matrixify-floating-button';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
      </svg>
    `;
    return button;
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'matrixify-panel';
    panel.innerHTML = `
      <div class="matrixify-panel-header">
        <h3>Matrixify</h3>
        <button id="matrixify-close-panel">&times;</button>
      </div>
      <div class="matrixify-panel-content">
        <div class="matrixify-section">
          <h4>Key Management</h4>
          <button id="matrixify-generate-keys">Generate New Keys</button>
          <div id="matrixify-key-status"></div>
        </div>
        <div class="matrixify-section">
          <h4>Encryption</h4>
          <input type="text" id="matrixify-message-input" placeholder="Enter message to encrypt">
          <input type="text" id="matrixify-recipient-input" placeholder="Recipient public key">
          <button id="matrixify-encrypt-btn">Encrypt Message</button>
          <div id="matrixify-encrypted-output"></div>
        </div>
        <div class="matrixify-section">
          <h4>Decryption</h4>
          <input type="text" id="matrixify-encrypted-input" placeholder="Enter encrypted message">
          <input type="text" id="matrixify-sender-input" placeholder="Sender public key">
          <button id="matrixify-decrypt-btn">Decrypt Message</button>
          <div id="matrixify-decrypted-output"></div>
        </div>
        <div class="matrixify-section">
          <h4>Your Public Key</h4>
          <textarea id="matrixify-public-key" readonly placeholder="Generate keys to see public key"></textarea>
          <button id="matrixify-copy-key">Copy Public Key</button>
        </div>
      </div>
    `;
    return panel;
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #matrixify-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #007bff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
        z-index: 10000;
        transition: all 0.3s ease;
      }

      #matrixify-floating-button:hover {
        background: #0056b3;
        transform: scale(1.1);
      }

      #matrixify-panel {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 400px;
        max-height: 600px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        display: none;
        overflow: hidden;
      }

      #matrixify-panel.active {
        display: block;
      }

      .matrixify-panel-header {
        background: #007bff;
        color: white;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .matrixify-panel-header h3 {
        margin: 0;
        font-size: 16px;
      }

      #matrixify-close-panel {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .matrixify-panel-content {
        padding: 20px;
        max-height: 520px;
        overflow-y: auto;
      }

      .matrixify-section {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }

      .matrixify-section:last-child {
        border-bottom: none;
      }

      .matrixify-section h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .matrixify-section input,
      .matrixify-section textarea {
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        box-sizing: border-box;
      }

      .matrixify-section textarea {
        height: 80px;
        resize: vertical;
        font-family: monospace;
        font-size: 10px;
      }

      .matrixify-section button {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-right: 8px;
        margin-bottom: 8px;
      }

      .matrixify-section button:hover {
        background: #0056b3;
      }

      .matrixify-section button:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }

      #matrixify-encrypted-output,
      #matrixify-decrypted-output,
      #matrixify-key-status {
        margin-top: 10px;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        word-break: break-all;
      }

      #matrixify-encrypted-output,
      #matrixify-decrypted-output {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        font-family: monospace;
      }

      #matrixify-key-status {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }

      #matrixify-key-status.error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners(): void {
    this.button.addEventListener('click', () => this.togglePanel());
    
    const closeBtn = this.panel.querySelector('#matrixify-close-panel');
    closeBtn?.addEventListener('click', () => this.hidePanel());

    // Prevent panel from closing when clicking inside it
    this.panel.addEventListener('click', (e) => e.stopPropagation());
  }

  private togglePanel(): void {
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  private showPanel(): void {
    this.panel.classList.add('active');
    this.isVisible = true;
  }

  private hidePanel(): void {
    this.panel.classList.remove('active');
    this.isVisible = false;
  }

  public mount(): void {
    document.body.appendChild(this.button);
    document.body.appendChild(this.panel);
  }

  public unmount(): void {
    this.button.remove();
    this.panel.remove();
  }

  public getButton(): HTMLElement {
    return this.button;
  }

  public getPanel(): HTMLElement {
    return this.panel;
  }
}