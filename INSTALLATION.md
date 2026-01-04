\# 🚀 Quick Start Guide



\## Installation Steps



\### 1. Prerequisites

```bash

\# Check Node.js version (must be 16+)

node --version



\# If not installed, get it from: https://nodejs.org/

```



\### 2. Install Dependencies

```bash

cd FS-Server-Status-Bot

npm install

```



\### 3. Configure Bot

```bash

\# Copy example config

cp global-config.example.json global-config.json



\# Edit and add your bot token

nano global-config.json

\# Change "YOUR\_BOT\_TOKEN\_HERE" to your actual Discord bot token

```



\### 4. Get a Discord Bot Token

1\. Go to https://discord.com/developers/applications

2\. Click "New Application" → Name it "FS Server Bot"

3\. Go to "Bot" tab → Click "Add Bot"

4\. Under "TOKEN" click "Reset Token" and copy it

5\. Paste token into `global-config.json`



\### 5. Invite Bot to Your Server

Generate invite link with these permissions:

\- ✅ View Channels

\- ✅ Send Messages

\- ✅ Embed Links

\- ✅ Attach Files

\- ✅ Read Message History



\*\*Or use Administrator for easy setup\*\*



Invite URL format:

```

https://discord.com/api/oauth2/authorize?client\_id=YOUR\_BOT\_ID\&permissions=18432\&scope=bot%20applications.commands

```

Replace `YOUR\_BOT\_ID` with your Application ID from Developer Portal.



\### 6. Start the Bot

```bash

npm start

```



You should see:

```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

&nbsp;  🚜 FS STATUS BOT v1.0 - MULTI-GUILD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Bot online as: YourBotName#1234

🌐 In 1 guilds

✅ 5 Slash Commands registered

🚀 All monitoring tasks started!

```



\### 7. Use the Bot

In your Discord server:

```

/setup

```

Then follow the interactive menu to add your first FS server!



---



\## FS Server Requirements



Your Farming Simulator dedicated server must:

\- ✅ Be running (obviously)

\- ✅ Have query enabled (default)

\- ✅ Be reachable on the query port (usually 10823)

\- ✅ Not block the bot's IP



\### Default FS Ports

\- \*\*Game Port:\*\* 10823 (UDP)

\- \*\*Query Port:\*\* Usually same as game port



---



\## First Server Setup Example



1\. `/setup` → Choose "📊 Server Management"

2\. Choose "➕ Add Server"

3\. Fill in modal:

&nbsp;  - \*\*Server Name:\*\* My FS22 Server

&nbsp;  - \*\*Server IP:\*\* yourserver.com

&nbsp;  - \*\*Server Port:\*\* 10823

4\. Select a channel for status updates

5\. Done! ✅



---



\## Troubleshooting



\### "Server shows offline"

\- Check IP and port

\- Verify FS server is running

\- Test with: `telnet yourserver.com 10823`



\### "Bot doesn't respond"

\- Check bot permissions with `/checkperms`

\- Verify bot token in config

\- Check logs in `logs/` folder



\### "Commands not appearing"

\- Wait 1-2 minutes after bot start

\- Kick and re-invite bot

\- Check bot has `applications.commands` scope



---



\## Support



\- 📖 Full README: See README.md

\- 🐛 Issues: Open an issue on GitHub

\- 💬 Questions: Check MC Bot repo for similar issues



\*\*Happy Farming! 🚜🌾\*\*

