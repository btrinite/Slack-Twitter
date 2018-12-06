require('dotenv').config()

const request = require('request').defaults({ encoding: null });

const { RTMClient, WebClient, CLIENT_EVENTS } = require('@slack/client');

const Twit = require('twit');
const TwitterText = require('twitter-text');
const URL = require('url');

const path = require('path'); // part of Node, no npm install needed
const ffmpeg = require('fluent-ffmpeg');

var twitterOptions = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  twitter_handle: process.env.TWITTER_HANDLE
}

const Twitter = new Twit(twitterOptions);

const slackOptions = {
  token: process.env.SLACK_TOKEN,
  autoReconnect: true,
  autoMark: true,
  post_channel: process.env.SLACK_POST_CHANNEL
}

TMP_PATH = process.env.TMP_PATH
const fs = require('fs');

const rtm = new RTMClient(slackOptions.token, {
    logLevel: 'error',
    dataStore: false
  }
);

const web = new WebClient(slackOptions.token);

function chatReply (message, text) {
  console.log ("Replay "+text+" to channel "+message.channel)
  web.chat.postMessage({ channel: message.channel, text: text }).then((res) => {
  }).catch((err) =>{
    console.log('Error:', err);
  });
}


rtm.start();

rtm.on('open', function() {
  console.log ("connected to Slack")

});
rtm.on('close', function () {
  console.log('Connection closed, retrying...');
  rtm.disconnect();
  // You will need to store the start options from the first time you connect and then reuse them here.
  rtm.once('disconnected', () => rtm.start());
});

function baseName(str) {
  if(str.lastIndexOf(".") != -1) {
    base = str.substring(0, str.lastIndexOf("."));
  }     
  return base;
}

rtm.on('message', function(message) {
  the_channel = "";
  web.conversations.list({types: 'private_channel'}).then(results => {
    the_channel = results.channels.find(conversation => (conversation.name && conversation.name == slackOptions.post_channel));
    if (the_channel) {
      console.log ("New post on Channel ("+message.subtype+")")
      if (message.channel == the_channel.id && (message.subtype != 'message_changed' && message.subtype != 'bot_message' && message.subtype != 'channel_join' && message.subtype != 'group_topic')) {
        if (message.files != undefined && message.files.length!=0) {
          console.log ("Let's post that on twitter")
          // There is an attachment
          var text = message.text
          if (text.length == 0) {text = message.files[0].title}
          // Check if multiple attachment
          if (message.files.length > 1) {
            chatReply (message, "Only the first attachement will be posted to twitter")
          }
          // check if message too long
          if (TwitterText.getTweetLength(text) > 140) {
            chatReply (message, "Attachment title too long !")
          }

          url_to_download = message.files[0].url_private_download
          var media = message.files[0].mimetype.substr(0, message.files[0].mimetype.indexOf('\/'));
          if (media=="image") {
            if (message.files[0].size > (4*1024*1024)){
              // Twitter does not support large picture, let's use a thumb already generated by Slack !
              url_to_download = message.files[0].thumb_1024
            }
          }
            // Let's get the original attachment
          request.get(url_to_download,{'auth': {
            'user': null,
            'pass': null,
            'bearer': slackOptions.token
            }}, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                  console.log ("attachment retrieved "+message.files[0].mimetype)
                  if (media=="image") {
                    data = new Buffer(body).toString('base64');
                    Twitter.post('media/upload', { media_data: data }, function (err, data, response) {
                      if (!err) {
                        // now we can assign alt text to the media, for use by screen readers and
                        // other text-based presentations and interpreters
                        var mediaIdStr = data.media_id_string
                        var altText = text
                        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
                      
                        Twitter.post('media/metadata/create', meta_params, function (err, data, response) {
                          if (!err) {
                            // now we can reference the media and post a tweet (media will attach to the tweet)
                            var params = { status: text, media_ids: [mediaIdStr] }
                      
                            Twitter.post('statuses/update', params, function (err, data, response) {
                              if (!err) {
                                chatReply (message, "Posted to twitter :heavy_check_mark:")
                              } else {
                                chatReply (message, ":warning: : was not able to tweet that, error :"+err)
                              }
                            })
                          } else {
                            chatReply (message, ":warning: : was not able to tweet that, error :"+err)
                          }
                        })
                      } else {
                        console.log ("Error while posting media "+err)
                        chatReply (message, ":warning: : was not able to tweet that, error :"+err)
                      }
                    })
                  } else if (media=="video") {
                    const localname = `tempVideo-${Date.now()}`+path.extname(url_to_download);
                    const PATH = path.join(
                      __dirname,
                      `${TMP_PATH}/${localname}`
                    );
                    fs.writeFile(PATH, body, function(error) {
                      var transcodedFile = `${baseName(PATH)}-720p.mp4`;
                      ffmpeg(PATH)
                      // Generate 720P video
                        .output(transcodedFile)
                        .videoCodec('libx264')  
                        .size('?x720')
                      .on('error', function(err) {
                            console.log('An error occurred: ' + err.message);
                            chatReply (message, ":warning: : was not able to tweet that, error :"+err.message)
                          
                      })	
                      .on('progress', function(progress) { 
                            console.log('... frames: ' + progress.frames);
                          
                      })
                      .on('end', function() { 
                        console.log('Finished processing'); 
                        // step ONE
                        Twitter.postMediaChunked({ file_path: transcodedFile }, function (err, data, response) {
                          if (err) {
                            console.log ("postMediaChunked returned : "+err)
                          }
                          const mediaIdStr = data.media_id_string;
                          const meta_params = { media_id: mediaIdStr };
                  
                          //  step TWO
                          Twitter.post('media/metadata/create', meta_params, function (err, data, response) {
                  
                            if (!err) {
                  
                              const params = { status: text, media_ids: [mediaIdStr] };
                  
                              // step THREE
                              Twitter.post('statuses/update', params, function (err, tweet, response) {
                  
                                if (err) {
                                  console.log ("statuses/update returned "+err)
                                  console.log (response)
                                  chatReply (message, ":warning: : was not able to tweet that, error :"+err)
                                } else {
                                  chatReply (message, "Posted to twitter :heavy_check_mark:")
                                }
                                fs.unlinkSync(PATH); // Deletes media from /tmp folder
                                fs.unlinkSync(transcodedFile); // Deletes media from /tmp folder
                  
                              }); // end '/statuses/update'
                  
                            } else {
                                console.log ("media/metadata/create returned "+err)
                                chatReply (message, ":warning: : was not able to tweet that, error :"+err)
      
                            } // end if(!err)
                  
                          }); // end '/media/metadata/create'
                  
                        }); // end T.postMedisChunked   
                          
                      })
                      .run();

                    }); //end fs.writeFile
                  } else {
                    chatReply (message, ":warning: : was not able to tweet that, unepected media type")
                  }
              } else {
                console.log ("Error while getting media "+error)
              }
          });
        } else {
          // This is a simple text
          fs.readdir(__dirname + '/plugins/filter', function (error, files) {
            text = message.text;
            files.forEach(function (file) {
              require(__dirname + '/plugins/filter/' + file);
            });
            filters = require(__dirname + '/plugins/filters.js').filters;
            filters.forEach(function(filter) {
              text = filter.execute(text);
            });
            if (TwitterText.getTweetLength(text) <= 140) {
              Twitter.post('statuses/update', { status: text }, function(error, data, response) {
                if (error) {
                  console.log('Posting tweet error: ' + error);
                } else {
                  chatReply (message, "Posted to twitter :heavy_check_mark:")
                }
              });
            }
            else {
              chatReply (message, "The tweet was too long! Character count: " + TwitterText.getTweetLength(message.text))
            } // If message longer than 140 character
          });
        }
      } // Message type.
    } else {
      console.log(`the channel named ${slackOptions.post_channel} was not found.`);
    }
  });
});