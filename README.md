<p align="center">
    <img src="./public/icon.svg" width="128"/>
    <h1 align="center">VodozeDOM</h1>
</p>

**A cross-browser browser extension to establish E2EE without the need for an external server**

> [!NOTE]
> this project is **WIP**. expect bugs and problems on usage.

## What exactly is this?

[**vodozemac**](https://github.com/matrix-org/vodozemac) is a library used by [**Matrix**](https://matrix.org/) (the most secure real time chat platform) to handle the encryption and decryption on each side of the converstation. this library creates an End to End Ecnryption (E2EE) between the 2 accounts and multiple devices for each account. in basic terms, only the 2 sides of the converstation can understand the messages sent.

**VodozeDOM** uses vodozemac to implement E2EE to any real time chat website, even if it doesn't support encryption.

## How it works?

when a supported chatting website is opened, **VodozeDOM** will hijack the website and add an encryption button for each private chat.

if the private chat has no established encryption, the button will start an encryption session. it will send an **OTK** (One Time Key) to the peer.

when an **OTK** (One Time Key) is received, **VodozeDOM** will automatically send a response containing a **prekey**.

once an **OTK** (One Time Key) or a **prekey** is received, the session is established and messages can be encrypted and decrypted accordingly.

the encrypted messages will be seen as a JSON with an unreadable cipher text if the chat is opened from a different place (a different browser or a native app).

## features

- Establish E2EE session
- Encrypt and decrypt text messages
- Store keys in IndexedDB 
- Cross-browser support (Firefox & Chrome)
- Typescript type safety

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/HoseanRC/VodozeDOM
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

just load a supported website, login and start using it.

## Supported Websites

| Website | URL | Descriotion |
|---------|-----|-------------|
| Bale | https://web.bale.ai | an iranian chatting website |

> [!NOTE]
> adding more websites requires deddication and each website should have it's injecting code developed. feel free to submit a pull request if you develop it for a website you use!

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.