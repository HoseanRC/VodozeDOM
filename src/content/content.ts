import { BaleChatManager } from './chats/bale/BaleChat';

class ContentScript {
  private baleChatManager: BaleChatManager | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.isBaleChat()) {
      this.baleChatManager = new BaleChatManager();
      await this.baleChatManager.initialize();
    }
  }

  private isBaleChat(): boolean {
    return window.location.hostname === 'web.bale.ai';
  }

  public destroy(): void {
    if (this.baleChatManager) {
      this.baleChatManager.destroy();
      this.baleChatManager = null;
    }
  }
}

new ContentScript();
