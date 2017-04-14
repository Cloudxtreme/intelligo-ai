'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpackDevServer = require('webpack-dev-server');

var _webpackDevServer2 = _interopRequireDefault(_webpackDevServer);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _config2 = require('config');

var _config3 = _interopRequireDefault(_config2);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import mongoose from 'mongoose';
// HTTP REQUEST LOGGER
var app = (0, _express2.default)(); // PARSE HTML BODY

var port = process.env.PORT;
// const port = 3000;
var devPort = 4000;

app.use((0, _morgan2.default)('dev'));
app.use(_bodyParser2.default.json({ verify: verifyRequestSignature }));

/* mongodb connection */
// const db = mongoose.connection;
// db.on('error', console.error);
// db.once('open', () => { console.log('Connected to mongodb server'); });
// mongoose.connect('mongodb://username:password@host:port/database=');
// mongoose.connect('mongodb://localhost:27017/');

/* use session */
app.use((0, _expressSession2.default)({
  secret: 'CodeLab1$1$234',
  resave: false,
  saveUninitialized: true
}));

app.use('/', _express2.default.static(_path2.default.join(__dirname, './../public')));

/* setup routers & static directory */
app.use('/api', _routes2.default);

app.get('/team', function (req, res) {
  res.sendFile(_path2.default.resolve(__dirname, './../public/team.html'));
});

app.get('/app', function (req, res) {
  res.sendFile(_path2.default.resolve(__dirname, './../public/words.html'));
});

/* handle error */
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

var firebase_config = {
  apiKey: "AIzaSyCnDxlx7nPSsrnyjop8apSXljlyDKVYbpk",
  authDomain: "memorize-a2ca1.firebaseapp.com",
  databaseURL: "https://memorize-a2ca1.firebaseio.com",
  storageBucket: "memorize-a2ca1.appspot.com",
  messagingSenderId: "125299550820"
};
_firebase2.default.initializeApp(firebase_config);
_firebase2.default.database.enableLogging(true);

var rootRef = _firebase2.default.database().ref();

var APP_SECRET = process.env.MESSENGER_APP_SECRET ? process.env.MESSENGER_APP_SECRET : _config3.default.get('appSecret');

var VALIDATION_TOKEN = process.env.MESSENGER_VALIDATION_TOKEN ? process.env.MESSENGER_VALIDATION_TOKEN : _config3.default.get('validationToken');

var PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN ? process.env.MESSENGER_PAGE_ACCESS_TOKEN : _config3.default.get('pageAccessToken');

var SERVER_URL = process.env.SERVER_URL ? process.env.SERVER_URL : _config3.default.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

(0, _request2.default)({
  url: 'https://graph.facebook.com/v2.8/me/thread_settings',
  qs: { access_token: PAGE_ACCESS_TOKEN },
  method: 'POST',
  json: {
    "setting_type": "call_to_actions",
    "thread_state": "new_thread",
    "call_to_actions": [{
      "payload": "PAYLOAD_NEW_THREAD"
    }]
  }
}, function (error, response, body) {
  if (error) {
    console.log('Error sending message: ', error);
  } else if (response.body.error) {
    console.log('Error: ', response.body.error);
  }
});

// greeting
(0, _request2.default)({
  url: 'https://graph.facebook.com/v2.8/me/thread_settings',
  qs: { access_token: PAGE_ACCESS_TOKEN },
  method: 'POST',
  json: {
    "setting_type": "greeting",
    "greeting": {
      "text": "Сайн байна уу! Би про бот байна."
    }
  }
}, function (error, response, body) {
  if (error) {
    console.log('Error sending message: ', error);
  } else if (response.body.error) {
    console.log('Error: ', response.body.error);
  }
});

// persistent menu
(0, _request2.default)({
  url: 'https://graph.facebook.com/v2.8/me/thread_settings',
  qs: { access_token: PAGE_ACCESS_TOKEN },
  method: 'POST',
  json: {
    "setting_type": "call_to_actions",
    "thread_state": "existing_thread",
    "call_to_actions": [{
      "type": "postback",
      "title": "💪 Шинэ үг авах"
    }, {
      "type": "postback",
      "title": "😁 Харилцан ярих"
    }, {
      "type": "web_url",
      "title": "😌 Судалгаа өгөх",
      "url": "https://docs.google.com/forms/d/e/1FAIpQLSfMbmOLRuss7NqBlgzMN3HZWIKs4_k9NHiBigqVO-l_D3_QEQ/viewform",
      "webview_height_ratio": "full"
    }, {
      "type": "postback",
      "title": "🌟 Тохиргоо"
    }, {
      "type": "web_url",
      "title": "🤖 Танилцуулга 👉",
      "url": "https://proenglish.herokuapp.com/"
    }]
  }
}, function (error, response, body) {
  if (error) {
    console.log('Error sending message: ', error);
  } else if (response.body.error) {
    console.log('Error: ', response.body.error);
  }
});

app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  if (data.object == 'page') {

    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    res.sendStatus(200);
  }
});

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = _crypto2.default.createHmac('sha1', APP_SECRET).update(buf).digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);

    sendTextMessage(senderID, "Quick reply tapped");
    return;
  }

  if (messageText) {

    switch (messageText) {
      case 'зураг':
        sendImageMessage(senderID);
        break;

      case 'gif':
        sendGifMessage(senderID);
        break;

      case 'дуу':
        sendAudioMessage(senderID);
        break;

      case 'бичлэг':
        sendVideoMessage(senderID);
        break;

      case 'файл':
        sendFileMessage(senderID);
        break;

      case 'товч':
        sendButtonMessage(senderID);
        break;

      case 'вэб':
        sendWebUrl(senderID);
        break;

      case 'утас':
        sendPhoneNumber(senderID);
        break;

      case 'судалгаа':
        sendFormUrl(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      case 'quick reply':
        sendQuickReply(senderID);
        break;

      case 'read receipt':
        sendReadReceipt(senderID);
        break;

      case 'typing on':
        sendTypingOn(senderID);
        break;

      case 'typing off':
        sendTypingOff(senderID);
        break;

      case '💪 Шинэ үг авах':
        sendLanguageLevel(senderID);
        break;

      case '🌟 Тохиргоо':
        sendSettings(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText + " " + getUserName());
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendWelcome(recipientId) {
  (0, _request2.default)({
    url: 'https://graph.facebook.com/v2.6/' + recipientId + '?access_token=' + process.env.PAGE_ACCESS_TOKEN
  }, function (error, response, body) {
    if (error || response.statusCode != 200) return;

    var fbProfileBody = JSON.parse(body);
    var userName = fbProfileBody["first_name"];
    var greetings = ["Hey", "Howdy", "Hello", "G'day", "Bonjur", "Good Evening", "Good Morning", "Yo", "What's up"];
    var randomGreeting = getRandomItemFromArray(greetings);
    var welcomeMsg = randomGreeting + ' ' + userName + ', \nI\'m your personal probot! \ntype \'pro\' and see what happens... \n\xAF\\_(\u30C4)_/\xAF \nor \'help\' for more details.\n      ';
    sendTextMessage(recipientId, welcomeMsg);
  });
}

function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function (messageID) {
      console.log("Received delivery confirmation for message ID: %s", messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + "at %d", senderID, recipientID, payload, timeOfPostback);

  sendTextMessage(senderID, "Postback called");
}

function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " + "number %d", watermark, sequenceNumber);
}

function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " + "and auth code %s ", senderID, status, authCode);
}

function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/img/pro.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/img/giphy.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/img/duu.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendVideoMessage(recipientId) {
  sendTypingOn(recipientId);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/img/eminem.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
  sendTypingOff(recipientId);
}

function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/img/hi.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Холбоо барих мэдээллүүд",
          buttons: [{
            type: "web_url",
            url: "https://proenglish.herokuapp.com",
            title: "Вэб хуудас"
          }, {
            type: "phone_number",
            title: "Утасны дугаар",
            payload: "+97689860933"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendPhoneNumber(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Холбоо барих утасны дугаар",
          buttons: [{
            type: "phone_number",
            title: "Утасруу залгах",
            payload: "+97689860933"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendWebUrl(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Вэб хуудас",
          buttons: [{
            type: "web_url",
            url: "https://www.proenglish.herokuapp.com",
            title: "Вэб хуудас"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendFormUrl(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Судалгаа",
          buttons: [{
            type: "web_url",
            url: "https://docs.google.com/forms/d/e/1FAIpQLSfMbmOLRuss7NqBlgzMN3HZWIKs4_k9NHiBigqVO-l_D3_QEQ/viewform?c=0&w=1",
            title: "Судалгаа өгөх"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Pro",
            subtitle: "Next-generation virtual reality",
            item_url: "https://proenglish.herokuapp.com",
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://proenglish.herokuapp.com",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble"
            }]
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://proenglish.herokuapp.com",
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://proenglish.herokuapp.com",
              title: "Вэбэд зочлох"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble"
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendReceiptMessage(recipientId) {
  var receiptId = "order" + Math.floor(Math.random() * 1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",
          timestamp: "1428444852",
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [{
        "content_type": "text",
        "title": "Action",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
      }, {
        "content_type": "text",
        "title": "Comedy",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
      }, {
        "content_type": "text",
        "title": "Drama",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
      }]
    }
  };

  callSendAPI(messageData);
}

function sendSettings(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Та өдөрт хэдэн цагт шинэ үг хүлээн авахаа тохируулна уу?",
      quick_replies: [{
        "content_type": "text",
        "title": "08:00",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
      }, {
        "content_type": "text",
        "title": "13:00",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
      }, {
        "content_type": "text",
        "title": "18:00",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
      }]
    }
  };

  callSendAPI(messageData);
}

function sendLanguageLevel(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Та ямар ангилалын үг хүлээн авахаа сонгоно уу?",
      quick_replies: [{
        "content_type": "text",
        "title": "TOEFL",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
      }, {
        "content_type": "text",
        "title": "IELTS",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
      }]
    }
  };

  callSendAPI(messageData);
}

function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons: [{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function getUserName() {
  var user = (0, _request2.default)({
    url: 'https://graph.facebook.com/v2.8/<USER_ID>?fields=first_name,last_name,profile_pic,locale,timezone,gender',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'GET',
    json: {
      "first_name ": "First Lastname",
      "id": "user_id"
    }
  });
  return user.first_name;
};

function callSendAPI(messageData) {
  (0, _request2.default)({
    uri: 'https://graph.facebook.com/v2.8/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
      } else {
        console.log("Successfully called Send API for recipient %s", recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

function getRandomNumber(minimum, maxmimum) {
  return Math.floor(Math.exp(Math.random() * Math.log(maxmimum - minimum + 1))) + minimum;
}

function randomIntFromInterval(min, max) {
  return getRandomNumber(min, max);
}

function textMatches(message, matchString) {
  return message.toLowerCase().indexOf(matchString) != -1;
}

function getRandomItemFromArray(items) {
  var random_item = items[getRandomNumber(0, items.length - 1)];
  return random_item;
}

function logObject(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

app.listen(port, function () {
  console.log('Express is listening on port', port);
});

if (process.env.NODE_ENV == 'development') {
  console.log('Server is running on development mode');
  var _config = require('../webpack.dev.config');
  var compiler = (0, _webpack2.default)(_config);
  var devServer = new _webpackDevServer2.default(compiler, _config.devServer);
  devServer.listen(devPort, function () {
    console.log('webpack-dev-server is listening on port', devPort);
  });
}