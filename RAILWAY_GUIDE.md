# 🚀 Railway Deployment Guide for DenClient Bot

Follow these steps to deploy your bot professionally on Railway.

## 1. Connect to GitHub
- Log in to [Railway.app](https://railway.app/).
- Click **"New Project"**.
- Select **"Deploy from GitHub repo"**.
- Choose your `denbot` repository (`mrsastaproo/denbot`).

## 2. Configure Environment Variables
In the Railway dashboard, go to the **Variables** tab and add the following from your `.env` file:
- `TOKEN`: Your Bot Token
- `CLIENT_ID`: Your Bot Application ID
- `GUILD_ID`: Your Server ID
- `LOG_CHANNEL`: Your Log Channel ID
- (Any other variables present in your local `.env`)

## 3. Set the Start Command
Railway should detect your `package.json` and use `npm start`. If it doesn't:
- Go to **Settings** -> **Deploy**.
- Set the **Start Command** to: `node deploy-commands.js && node index.js`
  - *Note: Running `deploy-commands.js` once is required to register new commands like `/deal` and `/setup-creator-apply`.*

## 4. Automatic Deploys
- Every time you push a change to your GitHub `main` branch, Railway will automatically rebuild and restart your bot.

---

### ⚠️ Important Notes:
- **den$close Fixed**: I have updated the bot so `den$close` now works in your new Deal channels too!
- **Creator Panel**: After deploying, use `/setup-creator-apply` in the channel where you want creators to see the "Apply" button.

To Kill :- taskkill /F /IM node.exe