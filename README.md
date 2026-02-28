# draft-relay

This is a standalone application part of the Althea Portfolio.

## Tech Stack
- **Framework**: Deno / Fresh
- **Deployment**: Netlify

## Local Development
1. Clone the repository and checkout this branch:
   ```bash
   git checkout draft-relay
   ```
2. Configure environment variables in `.env`.
3. Install and Build:
   ```bash
   deno task build
   ```

## Deployment
This branch is configured for Netlify Git Deploy.
- **Build Command**: `deno task build`
- **Publish Directory**: `_fresh`
