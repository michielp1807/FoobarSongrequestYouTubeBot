var http = require('http');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
//var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var SCOPES = ['https://www.googleapis.com/auth/youtube'];
var TOKEN_DIR = process.cwd() + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-tokens.json';
var LIVE_CHAT_ID_PATH = TOKEN_DIR + 'live-chat-id.json';

var service = google.youtube('v3');
var livestreamId;
var auth;

var SongCooldown = 600;
var UserCooldown = 30;

var songIsInCoolDown = [];
var userIsInCoolDown = {};
var songrequestsUsage = {}; // stores song while waiting for confirmation

var messageCounter = 0;
var maxMessagesPerSecond = 2;


console.log(" > Loading User Data");
console.log(" ");
fs.readFile('youtubebot-data.json', 'utf8', function readFileCallback(err, data){
  if (err){
    console.log(err);
  } else {
    var obj = JSON.parse(data);
	  livestreamId = obj.livestreamId;
	  SongCooldown = obj.songCooldown;
	  UserCooldown = obj.userCooldown;
  }
});

console.log(" > Loading Foobar Playlist");
console.log(" ");
var songCurrent = ["",""];
var songPrevious = ["",""];
checkNowPlaying();
songPrevious = songCurrent;
var songs = [];
var playlistFromHttp;
var request = require("request");
request({
    url: "http://127.0.0.1:8888/playlistviewer/?param3=playlist.json",
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode === 200) {
		playlistFromHttp = body;
    } else {
		console.log("Error: " + error)
	}
})
setTimeout(function(){
  // format loaded songs
	songs = playlistFromHttp.playlist;
	for(var i=0; i<songs.length; i++) {
		console.log(songs[i]);
	}
	console.log(songs[0]);
	
  // Load client secrets from a local file.
  console.log(" ");
  console.log(" > Loading Google Login");
  console.log(" ");
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }

    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), getVideoID);
  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth1 = new googleAuth();
    var oauth2Client = new auth1.OAuth2(clientId, clientSecret, redirectUrl);

    setInterval(refreshToken, 1800000, oauth2Client);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
      }
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    //console.log('Authorize this app by visiting this url: ', authUrl);
    var opn = require('opn');
    opn(authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(' > Enter the code from the page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log(' > Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }

  function refreshToken(oauth2Client) {
    console.log(" > Refreshing Token");
    oauth2Client.refreshAccessToken(function(err, credentials, response){
      //console.log(credentials);
      oauth2Client.credentials = credentials;
      storeToken(credentials);
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    //console.log('Token stored to ' + TOKEN_PATH);
  }
  /**
   * Lists the names and IDs of up to 10 files.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */

  function getVideoID(auth2) {
    auth = auth2;
    fs.readFile(LIVE_CHAT_ID_PATH, function(err, videoIDfromFile) {
      if (err) {
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        getLiveChatId(livestreamId);
      } else {
        videoIDfromFile = JSON.parse(videoIDfromFile);
        var liveChatId = videoIDfromFile.liveChatId;
        var videoID = videoIDfromFile.videoID;
        if (videoID == livestreamId) {
          setTimeout(function() {updateChat(liveChatId, '', true)}, 3000);
        } else {
          getLiveChatId(livestreamId);
        }
      }
    });
  }

  function getLiveChatId(videoID) {
    service.liveBroadcasts.list({
      auth: auth,
      id: videoID,
      part: 'snippet'
    }, function(err, response) {
      if (err) {
        console.log('[line 205] The API returned an error: ' + err);
        return;
      }

      try {
        fs.mkdirSync(TOKEN_DIR);
      } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
      }

      var liveChatId = response.items[0].snippet.liveChatId;

      fs.writeFile(LIVE_CHAT_ID_PATH, '{"liveChatId":"'+liveChatId+'","videoID":"'+videoID+'"}');

      setTimeout(function() {updateChat(liveChatId, '', true)}, 3000);
    });
  }

  function updateChat(liveChatId, pageToken, first) {
    if (first) {
      getChatMessages(liveChatId, pageToken, function(response) {
        console.log(' > Connected To Chat!');
        console.log(" ");
        setTimeout(function() {updateChat(liveChatId, response.nextPageToken, false)}, 2000)
      });
    } else {
      getChatMessages(liveChatId, pageToken, function(response) {
        var messages = response.items;
        if (messages.length>0) {
          for (i=0; i<messages.length; i++) {
            onNewChatMessage(liveChatId, messages[i]);
          }
        }
        setTimeout(function() {updateChat(liveChatId, response.nextPageToken, false)}, 2000);
      });
    }
  }

  function getChatMessages(liveChatId, pageToken, callback) {
    service.liveChatMessages.list({
      auth: auth,
      liveChatId: liveChatId,
      pageToken: pageToken,
      part: 'snippet, authorDetails'
    }, function(err, response){
      if (err) {
        console.log('[line 253] The API returned an error: ' + err);
        setTimeout(function() {updateChat(liveChatId, pageToken, false)}, 2000);
        //return;
      } else {
        callback(response);
      }
    });
  }

  function sendMessage(liveChatId, message) {
    if (messageCounter<maxMessagesPerSecond) {
      messageCounter++;
      service.liveChatMessages.insert({
        auth: auth,
        part: 'snippet',
        resource: {
          "snippet": {
            "liveChatId": liveChatId,
            "type": "textMessageEvent",
            "textMessageDetails": {
              "messageText": message
            }
          }
        }
      }, function(err, response){
        if (err) {
          console.log('[line 279] The API returned an error: ' + err);
          return;
        }
        setTimeout(resetMessageCounter, 1000);
      });
    } else {
      setTimeout(function(){sendMessage(liveChatId, message)}, 100);
    }
  }

  function onNewChatMessage(livechatId, messageObject) {
    var message = messageObject.snippet.displayMessage.toLowerCase();
    var channelId = messageObject.authorDetails.channelId;
    var username = messageObject.authorDetails.displayName;
    console.log(username + ": " + message);

    // COMMAND: !ping
    if (message == "!ping") {
      sendMessage(livechatId, "pong!");
    // COMMAND: !currentsong
    } else if (message.indexOf("!currentsong")==0 || message.indexOf("!currenttrack")==0 || message.indexOf("!nowplaying")==0 || (message.indexOf("!song")==0 && message.indexOf("!songrequest")==-1)) {
      request({
        url: "http://127.0.0.1:8888/playlistviewer/?param3=nowPlaying.json",
        json: true
      }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          if (body.isPlaying == 1) {
            if (songCurrent[0]=="?") {
              sendMessage(livechatId, 'Current song: "' + songCurrent[1] + '"! @' + username);
            } else {
              sendMessage(livechatId, 'Current song: "' + songCurrent[1] + '" by ' + songCurrent[0] + '! @' + username);
            }
          } else {
            sendMessage(livechatId, "No music playing... @" + username);
          }
        }
      })
    // COMMAND: !previoussong
		} else if (message.indexOf("!previoussong")==0 || message.indexOf("!previoustrack")==0) {
		   if (songPrevious[0].length>1 && songPrevious[1].length>1) {
			   if (songPrevious[0]=="?") {
				   sendMessage(livechatId, 'Previous song: "' + songPrevious[1] + '"! @' + username);
			   } else {
				   sendMessage(livechatId, 'Previous song: "' + songPrevious[1] + '" by ' + songPrevious[0] + '! @' + username);
			   }
		   } else {
			    sendMessage(livechatId, "I can't remember the previous song... @" + username);
		   }
	  // COMMAND: !queuelength
	  } else if (message.indexOf("!queuelength")==0) {
			request({
				url: "http://127.0.0.1:8888/playlistviewer/?param3=nowPlaying.json",
				json: true
			}, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					if (body.queueLength == "") {
						sendMessage(livechatId, 'The queue is currently empty. @' + username);
					} else {
						sendMessage(livechatId, 'The playback queue is ' + body.queueLength + ' long. @' + username);
					}
				}
			})
		// COMMAND: !songrequest
		} else if (message.indexOf("!songrequest")==0) {
      if (userIsInCoolDown[channelId] === true) {
        sendMessage(livechatId, 'You can only request a song every ' + UserCooldown + ' seconds... @' + username);
      } else {
        message = message.substring(12).replace(/[-+,.–()'"\\\/\[\]~!@#$%^&*_=;:<>{}|]|\s/g,' ').replace(/\s\s+/g,' ').toLowerCase();
        if (message.length < 3) {
  			  sendMessage(livechatId, 'Request songs from the playlist by typing !songrequest + something to search for! @' + username);
  		  } else {
			var result = searchSongs(message);
			if (result == undefined) {
			  sendMessage(livechatId, "No results found. @" + username);
			  fs.appendFile('failedSongs.txt',  "\r\n [" + username + "] " + message.substring(13), function (err) {});
			} else {
			  if (songIsInCoolDown[result] === true) {
			    sendMessage(livechatId, 'The song "'+songs[result]+'" is on a cooldown... @' + username);
			  } else {
				songrequestsUsage[channelId] = result;
				sendMessage(livechatId, 'I found something for you: "'+songs[result]+'", say "!yes" for it to be added to the queue! @' + username);
				setTimeout(resetSongrequestUsage,30000,channelId,result);
			  }
			}
  		  }
        }
		// COMMAND: !yes (confirmation for songrequests)
	  } else if (message == "!yes" && songrequestsUsage[channelId]) {
		var result = songrequestsUsage[channelId];
		delete songrequestsUsage[channelId];
		if (songIsInCoolDown[result] === true) {
			sendMessage(livechatId, 'The song "'+songs[result]+'" is on a cooldown... @' + username);
		} else {
			songIsInCoolDown[result] = true;
			userIsInCoolDown[channelId] = true;
			setTimeout(resetSongCoolDown,SongCooldown*1000,result);
			setTimeout(resetUserCoolDown,UserCooldown*1000,channelId,username);
			http.get("http://127.0.0.1:8888/default/?cmd=QueueItems&param1="+(result),function(res){
			  sendMessage(livechatId, '"'+songs[result]+'" has been added to the queue! @' + username);
			});
		}
	  }
	}
}, 1000);

function resetSongrequestUsage(channelId,result) {
	if (songrequestsUsage[channelId]==result) {
		delete songrequestsUsage[channelId];
	}
}

function checkNowPlaying() {
	var request = require("request");
	request({
		url: "http://127.0.0.1:8888/playlistviewer/?param3=nowPlaying.json",
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			var songCurrentP = songCurrent;
			songCurrent = [body.artist, body.title];
			if (songCurrent[0] != songCurrentP[0] || songCurrent[1] != songCurrentP[1]) {
				console.log(" ");
				console.log(" > New song: " + songCurrent[0] + " - " + songCurrent[1]);
				console.log(" ");
				songPrevious = songCurrentP;
        var songIndex = searchSongs((songCurrent[0] + " " + songCurrent[1]).replace(/[-+,.–()']/g,'').toLowerCase().split(" "));
        songIsInCoolDown[songIndex] = true;
        setTimeout(resetSongCoolDown,SongCooldown*1000,songIndex);
			}
		}
	});
	setTimeout(checkNowPlaying,10000);
}

function resetSongCoolDown(songIndexToReset) {
	console.log(" ");
	console.log(" > Reset cooldown for " + songs[songIndexToReset]);
	console.log(" ");
	songIsInCoolDown[songIndexToReset] = false;
}

function resetUserCoolDown(channelId, username) {
	console.log(" ");
	console.log(" > Reset cooldown for " + username);
	console.log(" ");
	delete userIsInCoolDown[channelId];
}

function resetMessageCounter() {
	messageCounter--;
}

// Search Algorithm

function searchSongs(input) {
  input = input.toString().replace(/[-+,.–()'"\\\/\[\]~!@#$%^&*_=;:<>{}|]|\s/g,' ').replace(/\s\s+/g,' ').toLowerCase();
  var highestScore = 0;
  var bestSong = -1;
  for (var i=0; i<songs.length; i++) {
    songScore = getScore(input, songs[i]);
    if (songScore>highestScore) {
      highestScore = songScore;
      bestSong = i;
    } else if (songScore == highestScore && highestScore != 0) {
      if (Math.random()<.4) bestSong = i;
    }
  }
  return bestSong;
}

function getScore(input, song) {
  song = song.replace(/[-+,.–()'"\\\/\[\]~!@#$%^&*_=;:<>{}|]|\s/g,' ').replace(/\s\s+/g,' ').toLowerCase();
  var score = 0;

  for (var i=0; i<input.length; i++) {
    for (var j=i+1; j<input.length+1; j++) {
      if (song.indexOf(input.substring(i,j)) != -1) score+=input.substring(i,j).length;
    }
  }
  
  //console.log(score + ' - ' + song);
  return score;
}