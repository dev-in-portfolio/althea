# Help — VaultKey

## Overview
VaultKey is a Remix-powered secure vault for storing sealed, encrypted entries that are only decrypted in-browser.

## Features
- **Client-Side Encryption**: Entries are stored encrypted and decrypted locally using a client-side crypto utility.
- **Sealed Entries**: View titles and tags of entries without exposing the sensitive content until unlocked.
- **Remix Efficiency**: Fast server-side loading of entry lists with secure client-side interactions.

## How to Use
1. Browse the list of sealed entries on the index page.
2. Click an entry to view its details; you will be prompted to unlock it using your vault key.
3. Create new entries via the 'New' screen, where content is encrypted before transmission.
