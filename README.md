\# 🚜 Farming Simulator Server Status Bot



\*\*Feature-identical Discord bot for monitoring Farming Simulator dedicated servers\*\*  

Based on [MC Server Status Bot v5.1.2](https://github.com/Gamer100309/MC-Server-Status-Bot) by Gamer100309



---



\## 🌟 Features



\### ✅ Core Features

\- ✅ \*\*Multi-Guild Support\*\* - Works in unlimited Discord servers

\- ✅ \*\*Unlimited Servers\*\* - Monitor unlimited FS servers per guild

\- ✅ \*\*Real-time Monitoring\*\* - Live server status updates

\- ✅ \*\*Persistent Messages\*\* - Updates existing messages (no spam)

\- ✅ \*\*State Recovery\*\* - Survives bot restarts

\- ✅ \*\*Network Error Handling\*\* - No message spam on timeouts



\### 📊 Server Management

\- \*\*Add\*\* - Add new FS servers via interactive modal

\- \*\*Edit\*\* - Change server details (IP, port, name)

\- \*\*Delete\*\* - Remove servers with automatic cleanup

\- \*\*Toggle Monitoring\*\* - Enable/disable per server (v5.1.2 feature)

\- \*\*Bulk Actions\*\* - "Enable all" / "Disable all" monitoring



\### 🎨 Customization

\- \*\*Embed Colors\*\* - Custom colors for online/offline states

\- \*\*Field Visibility\*\* - Toggle IP, port, map, mods, players, password

\- \*\*Update Intervals\*\* - 5s, 10s, 30s, 1m, 5m

\- \*\*Interactive Buttons\*\* - IP, port, and player list buttons

\- \*\*Server Icons\*\* - Optional thumbnails (if FS provides)



\### 🌐 Multi-Language System

\- \*\*Default Language:\*\* English

\- \*\*Built-in:\*\* German (de), English (en)

\- \*\*Custom Languages\*\* - Create your own language files

\- \*\*Global \& Per-Server\*\* - Set language globally or per server

\- \*\*Fully Translatable\*\* - All UI text can be customized



\### 🔐 Permissions

\- \*\*Role-Based Access\*\* - Control who can use `/setup`

\- \*\*Admin Access\*\* - Administrators always have access

\- \*\*Permission Checker\*\* - Verify bot permissions in channels



---



\## 📦 Installation



\### Prerequisites

\- Node.js 16.0.0 or higher

\- A Discord Bot Token [Guide](https://github.com/Gamer100309/MC-Server-Status-Bot/wiki/Discord%E2%80%90Bot%E2%80%90Setup)

\- A Farming Simulator dedicated server to monitor



\### Setup



1\. \*\*Clone or download this repository\*\*

&nbsp;  ```bash

&nbsp;  git clone https://github.com/YOUR-USERNAME/FS-Server-Status-Bot.git

&nbsp;  cd FS-Server-Status-Bot

&nbsp;  ```



2\. \*\*Install dependencies\*\*

&nbsp;  ```bash

&nbsp;  npm install

&nbsp;  ```



3\. \*\*Configure the bot\*\*

&nbsp;  ```bash

&nbsp;  cp global-config.example.json global-config.json

&nbsp;  nano global-config.json  # Enter your bot token

&nbsp;  ```



4\. \*\*Start the bot\*\*

&nbsp;  ```bash

&nbsp;  npm start

&nbsp;  ```



5\. \*\*Invite the bot to your Discord server\*\*

&nbsp;  - Use the Discord Developer Portal to generate an invite link

&nbsp;  - Required Permissions: View Channels, Send Messages, Embed Links, Attach Files, Read Message History

&nbsp;  - Recommended: Administrator (for easy setup)



---



\## 🚀 Usage



\### Slash Commands



\- `/setup` - Interactive setup menu (ephemeral)

\- `/reload` - Reload config and restart monitoring

\- `/refresh` - Delete and recreate status messages

\- `/botinfo` - Show bot statistics

\- `/checkperms` - Check bot permissions in a channel



\### Setup Menu Categories



1\. \*\*📊 Server Management\*\* - Add, edit, delete, toggle servers

2\. \*\*⏱️ Update Intervals\*\* - Configure update timings

3\. \*\*🎨 Embed Design\*\* - Customize colors and fields

4\. \*\*🔘 Button Settings\*\* - Configure interactive buttons

5\. \*\*🔐 Permissions\*\* - Manage setup access

6\. \*\*⚙️ Global Settings\*\* - Footer text, default colors

7\. \*\*🌐 Texts \& Language\*\* - Customize language



---



\## 🎮 Farming Simulator Server Query



This bot uses \*\*GameDig\*\* to query Farming Simulator servers.



\### Supported Versions

\- Farming Simulator 25 (FS25)

\- Farming Simulator 22 (FS22)

\- Farming Simulator 19 (FS19)



\### Default Port

\- \*\*10823\*\* (standard FS dedicated server port)



\### Displayed Information

\- 🗺️ \*\*Map Name\*\* - Current map

\- ⚙️ \*\*Version\*\* - FS version

\- 👥 \*\*Players\*\* - Online/Max players + player list

\- 📶 \*\*Ping\*\* - Response time

\- 🔒 \*\*Password\*\* - Protected or not

\- 📦 \*\*Mods\*\* - Number of mods (if available)



---



\## 📝 Configuration



\### Guild-Specific Config

Each Discord server gets its own config file:

```

configs/guild\_XXXXXXXXX.json

```



\### Server Structure

```json

{

&nbsp; "serverName": "My FS22 Server",

&nbsp; "serverIP": "example.com",

&nbsp; "serverPort": 10823,

&nbsp; "channelID": "123456789",

&nbsp; "updateInterval": 10000,

&nbsp; "monitoringEnabled": true,

&nbsp; "embedSettings": {

&nbsp;   "colorOnline": "#00FF00",

&nbsp;   "colorOffline": "#FF0000",

&nbsp;   "showIP": true,

&nbsp;   "showPort": false,

&nbsp;   "showPlayerList": true,

&nbsp;   "showMap": true,

&nbsp;   "showPassword": true,

&nbsp;   "showMods": true

&nbsp; },

&nbsp; "buttonSettings": {

&nbsp;   "enabled": true,

&nbsp;   "showIPButton": true,

&nbsp;   "showPortButton": false,

&nbsp;   "showPlayersButton": true

&nbsp; },

&nbsp; "textSettings": {

&nbsp;   "language": "global"

&nbsp; }

}

```



---



\## 🔧 Development



\### Project Structure

```

FS-Server-Status-Bot/

├── index.js                  # Main entry point

├── package.json              # Dependencies

├── global-config.json        # Global settings (token)

├── cogs/                     # All modules

│   ├── ConfigManager.js      # Config handling

│   ├── MessageHandler.js     # Multi-language system

│   ├── StateManager.js       # Message persistence

│   ├── Logger.js             # Logging system

│   ├── StatusChecker.js      # FS server query (GameDig)

│   ├── EmbedBuilder.js       # Status embed creation

│   ├── IconManager.js        # Server icon handling

│   ├── MonitoringManager.js  # Server monitoring loop

│   ├── CommandHandler.js     # Slash command handler

│   ├── InteractionHandler.js # Button/menu handler

│   ├── SetupMenus.js         # Setup UI builder

│   └── PermissionManager.js  # Permission checking

├── texts/                    # Language files

│   ├── de.json               # German

│   ├── en.json               # English (default)

│   └── custom\_\*.json         # User custom languages

├── configs/                  # Per-guild configs

├── states/                   # Message ID storage

├── Icons/                    # Server icons (optional)

└── logs/                     # Daily log files

```



\### Key Differences from MC Bot

1\. \*\*StatusChecker.js\*\* - Uses GameDig instead of minecraft-server-util

2\. \*\*EmbedBuilder.js\*\* - FS-specific fields (map, password, mods vs MOTD)

3\. \*\*Default Port\*\* - 10823 instead of 25565

4\. \*\*Emojis\*\* - FS-specific (🗺️ Map, 🔒 Password, 📦 Mods)



---



\## 🐛 Troubleshooting



\### Bot doesn't respond to commands

\- Check if bot has proper permissions

\- Run `/checkperms` to verify permissions

\- Ensure bot token is correct in `global-config.json`



\### Server shows as offline

\- Verify server IP and port

\- Check if server is actually running

\- Ensure firewall allows query port (usually same as game port)

\- FS server must have query enabled



\### Monitoring not working

\- Check if `monitoringEnabled` is `true` in config

\- Use `/reload` to restart monitoring

\- Check logs for errors



---



\## 📜 Version History



\### v1.0.0 (Initial Release)

\- ✅ Complete feature parity with MC Server Status Bot v5.1.2

\- ✅ GameDig integration for FS server queries

\- ✅ FS-specific fields (map, password, mods)

\- ✅ Multi-language system (English default)

\- ✅ Monitoring toggle per server

\- ✅ Bulk enable/disable actions

\- ✅ Network error handling (no spam)

\- ✅ State persistence after restart



---



\## 📄 License



MIT License - Based on MC Server Status Bot by Gamer100309



---



\## 🙏 Credits



\- \*\*Original Developer:\*\* \[Gamer100309](https://github.com/Gamer100309) | RedCity Industries

\- \*\*MC Bot Repository:\*\* \[MC-Server-Status-Bot](https://github.com/Gamer100309/MC-Server-Status-Bot)

\- \*\*FS Bot Adaptation:\*\* Claude (Anthropic)

\- \*\*Query Library:\*\* \[GameDig](https://github.com/gamedig/node-gamedig)



---



\## 🔗 Links



\- \[MC Server Status Bot (Original)](https://github.com/Gamer100309/MC-Server-Status-Bot)

\- \[Discord.js Documentation](https://discord.js.org/)

\- \[GameDig Documentation](https://github.com/gamedig/node-gamedig)

\- \[Farming Simulator](https://www.farming-simulator.com/)



---



\## 💡 Support



For issues, questions, or feature requests, please open an issue on GitHub.



\*\*Happy Farming! 🚜🌾\*\*

