console.log("popup loaded")
document.addEventListener('DOMContentLoaded', () => {
  console.log("Dom loaded popup");
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  const generateKeysBtn = document.getElementById('generate-keys') as HTMLButtonElement;
  const openPanelBtn = document.getElementById('open-panel') as HTMLButtonElement;
  const exportKeysBtn = document.getElementById('export-keys') as HTMLButtonElement;

  // Check current status
  checkStatus();

  generateKeysBtn?.addEventListener('click', generateKeys);
  openPanelBtn?.addEventListener('click', openEncryptionPanel);
  exportKeysBtn?.addEventListener('click', exportPublicKey);

  async function checkStatus() {
    try {
      console.log("sending msg");
      const response = await sendMessage({ 
        type: 'GET_KEYS', 
        data: { userId: 'anonymous-user' } 
      });
      console.log(`sent msg ${response}`);

      if (response.success && response.publicKey) {
        statusDiv!.textContent = 'Keys available and ready';
        statusDiv!.className = 'status success';
      } else {
        statusDiv!.textContent = 'No keys found - generate keys to start';
        statusDiv!.className = 'status error';
      }
    } catch (error) {
      statusDiv!.textContent = 'Error checking status';
      statusDiv!.className = 'status error';
    }
  }

  async function generateKeys() {
    try {
      generateKeysBtn!.textContent = 'Generating...';
      generateKeysBtn!.disabled = true;

      const response = await sendMessage({ 
        type: 'GENERATE_KEYS', 
        data: { userId: 'anonymous-user' } 
      });

      if (response.success) {
        statusDiv!.textContent = 'Keys generated successfully';
        statusDiv!.className = 'status success';
      } else {
        statusDiv!.textContent = response.error || 'Failed to generate keys';
        statusDiv!.className = 'status error';
      }
    } catch (error) {
      statusDiv!.textContent = 'Error generating keys';
      statusDiv!.className = 'status error';
    } finally {
      generateKeysBtn!.textContent = 'Generate New Keys';
      generateKeysBtn!.disabled = false;
    }
  }

  async function openEncryptionPanel() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'OPEN_PANEL' });
      }
      window.close();
    } catch (error) {
      statusDiv!.textContent = 'Error opening panel';
      statusDiv!.className = 'status error';
    }
  }

  async function exportPublicKey() {
    try {
      const response = await sendMessage({ 
        type: 'GET_KEYS', 
        data: { userId: 'anonymous-user' } 
      });

      if (response.success && response.publicKey) {
        await navigator.clipboard.writeText(response.publicKey);
        exportKeysBtn!.textContent = 'Copied to clipboard!';
        setTimeout(() => {
          exportKeysBtn!.textContent = 'Export Public Key';
        }, 2000);
      } else {
        statusDiv!.textContent = 'No public key found';
        statusDiv!.className = 'status error';
      }
    } catch (error) {
      statusDiv!.textContent = 'Error exporting public key';
      statusDiv!.className = 'status error';
    }
  }

  function sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response?.data || response);
      });
    });
  }
});
