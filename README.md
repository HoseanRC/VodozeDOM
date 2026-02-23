# VodozeDOM

A cross-browser extension for end-to-end encryption of web chat messages using the vodozemac library.

## Features

- 🔐 Generate and manage encryption key pairs
- 🔒 Encrypt messages with recipient's public key
- 🔓 Decrypt messages with sender's public key
- 💾 Secure key storage using IndexedDB
- 🌐 Cross-browser support (Firefox & Chrome)
- 🎯 TypeScript for type safety
- 📱 Floating UI panel for easy access

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd vodozedom
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension:
```bash
pnpm build
```

### Loading in Browser

#### Chrome/Edge
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

#### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `dist/manifest.json` file

## Usage

### Basic Operations

1. **Generate Keys**: Click the floating button in the bottom-right corner of any page, then click "Generate New Keys"
2. **Encrypt Message**: Enter a message and the recipient's public key, then click "Encrypt Message"
3. **Decrypt Message**: Enter an encrypted message and the sender's public key, then click "Decrypt Message"
4. **Copy Public Key**: Click "Copy Public Key" to share your public key with others

### For Later Implementation

The following functions are exposed for future P2P integration:
- `createGroupSession()` - For group chat encryption
- `encryptForGroup()` - For encrypting messages to a group
- `decryptFromGroup()` - For decrypting group messages

## Architecture

- **Background Script**: Handles encryption operations and key management
- **Content Script**: Injects the floating UI and handles user interactions
- **Popup**: Extension popup for quick access to main functions
- **Storage Service**: IndexedDB wrapper for secure key storage
- **Encryption Service**: Interface to vodozemac-wasm-bindings

## Security

- Private keys are stored securely in IndexedDB
- All encryption happens locally in the browser
- No data is sent to external servers
- Uses the vodozemac library for cryptographic operations

## Development

### Scripts

- `pnpm dev` - Build in watch mode
- `pnpm build` - Production build
- `pnpm typecheck` - Type checking
- `pnpm lint` - ESLint checking
- `pnpm clean` - Clean build directory

### Project Structure

```
src/
├── background/     # Background script
├── content/        # Content script
├── components/     # UI components
├── types/          # TypeScript types
├── utils/          # Utility functions
└── popup/          # Popup script
    └── popup.html  # Popup HTML

public/
├── manifest.json   # Extension manifest
└── content.css     # Content script styles
```

## License

ISC