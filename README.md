# MichielP1807’s Foobar Songrequest YouTube Bot
A YouTube bot that lets people from YouTube live chat request songs from your Foobar2000 playlist.

For the Twitch version of this bot go [here](https://github.com/MichielP1807/FoobarSongrequestTwitchBot).

## Needed for this bot:

* [foobar2000](http://www.foobar2000.org/download "Download foobar2000")

* [node.js](https://nodejs.org/ "Download node.js")
  
* [foo_httpcontrol](https://www.dropbox.com/s/uglqfqwbtzl7xio/foobarCon_0.97.28-fc.exe?dl=1 "Download foo_httpcontrol")
  
* [The two folders in this repository](https://github.com/MichielP1807/FoobarSongrequestYouTubeBot/archive/master.zip "Download this repository")

## Commands:

* !songrequest [search query] - request songs from the Foobar2000 playlist

* !currentsong - bot will post the artist and title of the currently playing song in chat (works via whispers as well)

* !previoussong - bot will post the artist and title of the previous song in chat (works via whispers as well)

* !queuelength - bot will post the length of the playback queue in chat (works via whispers as well)

* !ping - bot responds with pong! to verify it is working

## Features:

* Cooldowns for individual songs and for individual users

* Automatically save requests that aren't in your playlist to a text file

## How to setup: 

####  1. Setting up foobar2000
  
1.	Install Foobar2000
  
2.	Open Foobar2000
  
3.	Create a playlist with your music
  
4.	Close Foobar2000
  
####  2. Setting up foo_httpcontrol
  
1.	Install foo_httpcontrol
  
2.	Open Foobar2000
  
3.	Allow Foobar2000 access to the internet
  
4.	Go to http://127.0.0.1:8888/ in your browser to make sure it’s installed, you should see some installed templates, we'll now install some more
 
5.  Copy the foo_httpcontrol_data from this repository
  
6.	Open up appdata (press the windows key and R, type in %appdata% and press ok)
  
7.	Navigate to *C:\Users\UserNameHere\AppData\Roaming\foobar2000\*

8.  Paste the foo_httpcontrol_data folder here
  
9.	Go to http://127.0.0.1:8888/playlistviewer/ in your browser, see the name of the currently playing song there
  
####  3. Setting up node.js
  
1.	Install node.js
  
2.	To test if node.js is installed correctly:
    1. Open cmd
    2. Type node and hit enter
    3. You're now in javascript land!
  
####  4. Setting up the YouTube API for the bot
  
1.	Go to https://console.developers.google.com/apis/dashboard and log in with a Google account
  
2.	Click on Select a project on the top left next to the Google APIs logo
  
3.	Click on the plus in the top right to add a project
  
4.	Give your project a name, it doesn't really matter what you call it, and click on create
  
5.	After your project has been created, click on activate API
  
6.	Click on the YouTube Data API in the YouTube APIs section
  
7.	Select your project and activate the YouTube Data API
 
8.	Now click on credentials in the menu on the left of the screen
  
9.	Click on Oauth consent screen and then choose your email adress, set a product name and hit save
  
10.	Click on create credentials and choose OAuth client ID
  
11.	For application type choose other, give it a name and click create
  
12.	Close the popup message and click on the download icon to the right of your client id

13.	Put the file in the YouTubeBot folder from this repository and rename the file to client_secret.json
  
####  5. Setting up the YouTube Bot
  
1.	Open youtubebot-data.json in the YouTubeBot folder in a text editor (notepad, atom, notepad++ etc.)
  
2.	Put the video id of your livestream between the quotation marks after the *"livestreamId":*

3.	You can also change the cooldown time for either songs or users, these values are in seconds

4.	Save the file and close the text editor
  
5.	Send a message in the chat with your YouTube account to make sure the chat is working
  
6.	Run youtubebot-starter.bat, it should be showing some of the songs in your playlist
  
7.	Login with the YouTube channel you want to use as a bot, make sure that channel is either the owner of the livestream or a moderator, otherwise it won't work
  
8.	Copy the code you get after logging in and paste it in the command prompt (right click and click paste) and hit enter
  
7.	It now should be working, write *!ping* in chat, it should respond with *pong!*, you can also see the chat in the twitchbot window

8.	Try requesting a song from your playlist, it should now be working
  
####  6. Trouble shooting
  
1.	If it’s adding the wrong song to the queue, make sure you’ve got the correct playlist active when you launch the bot, try restarting the bot
  
2.	If it’s not adding any song at all please first try to restart the bot, if it still doesn’t work ask for help

If you have any other problems please make an issue at [here](https://github.com/MichielP1807/FoobarSongrequestYouTubeBot/issues/new "New GitHub Issue") or tweet me @MichielP1807!
