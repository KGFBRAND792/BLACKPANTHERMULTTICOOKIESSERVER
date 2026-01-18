const express = require('express');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch'); // Install with: npm install node-fetch

const app = express();
const port = 3000;

app.use(cookieParser());

// Replace with your actual Facebook app ID and secret
const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_APP_SECRET = 'YOUR_FACEBOOK_APP_SECRET';

async function refreshAccessToken(refreshToken) {
    const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${refreshToken}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.access_token) {
            return data.access_token;
        } else {
            console.error('Failed to refresh access token:', data);
            return null;
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}

app.get('/facebook-login-success', (req, res) => {
  // Simulate Facebook login success (replace with actual Facebook login logic)
  const facebookUserId = '1234567890';
  const accessToken = 'EAA...';
  const refreshToken = 'EAAR...';
  const sessionId = uuidv4();

  // Set cookies
  res.cookie('facebookUserId', facebookUserId, { maxAge: 3600000, httpOnly: true, secure: false, sameSite: 'lax' });
  res.cookie('accessToken', accessToken, { maxAge: 3600000, httpOnly: true, secure: false, sameSite: 'lax' });
  res.cookie('refreshToken', refreshToken, { maxAge: 31536000000, httpOnly: true, secure: false, sameSite: 'lax' });
  res.cookie('sessionId', sessionId, { maxAge: 86400000, httpOnly: true, secure: false, sameSite: 'lax' });

  res.send('Facebook login successful! Cookies set.');
});

app.get('/profile', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const facebookUserId = req.cookies.facebookUserId;

    if (!accessToken || !refreshToken) {
        return res.status(401).send('Unauthorized. Please log in with Facebook.');
    }

    // Check if the access token is still valid (simplified)
    // In a real application, you'd make a request to the Facebook Graph API
    // to verify the token.  If it's invalid, refresh it.
    // For this example, we'll just assume it's valid for a short period.

    let currentAccessToken = accessToken;

    // Refresh the access token if needed (example)
    // In a real app, you would check the expiration time of the access token
    // and refresh it if it's close to expiring.
    const now = Date.now();
    const tokenExpiration = now + 300000; // Assume it expires in 5 minutes

    if (now >= tokenExpiration) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
            currentAccessToken = newAccessToken;
                      res.cookie('accessToken', newAccessToken, { maxAge: 3600000, httpOnly: true, secure: false, sameSite: 'lax' });
        } else {
            return res.status(500).send('Failed to refresh access token.');
        }
    }

    // Here, you would use the currentAccessToken to make requests to the Facebook Graph API
    // to fetch the user's profile information.

    res.send(`<h1>User Profile</h1>
              <p>Facebook User ID: ${facebookUserId}</p>
              <p>Access Token: (refreshed or original)</p>`);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});  
            