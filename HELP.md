# Help — Hono Gatekeeper

## Overview
Gatekeeper is an authentication and rate-limiting proxy service for securing Althea APIs.

## Features
- **Proxy Logic**: Transparently proxy requests to backend services.
- **Rate Limiting**: Protect your infrastructure from excessive traffic.
- **Authentication**: Built-in logic for user key validation.

## How to Use
1. Route your API traffic through the Gatekeeper endpoint.
2. Configure rate limits via the admin configuration.
3. Ensure all incoming requests include a valid auth key.
