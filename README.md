Preamble
====
Compare to orignal work, this version does :
- Support simple Slack to Tweet through a dedicated channel
- Support following media :
  - Support text (up to the maximum size allowed by twitter)
  - Support Picture (but dot not check if picture meet Twitter constraints)
  - Support Video (transcoding is done with ffpmeg to meet twitter constraints)
  - Support a single media (attachment) per Slack message
- For post including audio or video, Detect if message if part of chat or media caption
- Give a feedback through Slack when tweet is posted successfully 

Installation
====

1. Create two channels in Slack.
  1. Name the channel for posting to Twitter something obvious like 'twitter_post'.
2. Get a Slack bot account. Visit https://my.slack.com/services/new and under "DIY Integrations & Customizations" click the "Add" button. Once you create this bot (name it something obvious like "twitter_bot") you will get an API token.
2. Invite the bot to the channels you created in step #1. To do that, go to each channel and, in the top
    drop-down for the channel, click "Invite others to this channel..." and select your bot created in
    step #2.
3. Login to the Twitter website Application Management website at https://apps.twitter.com/ with the Twitter account that you want to post tweets to from Slack. Click "Create New App". Then create Keys and Access tokens.
4. Set your environment variables. See the section below.
5. Start the bot! Use [PM2](https://github.com/Unitech/pm2) or [forever](https://github.com/foreverjs/forever) or something that will daemonize the bot.

https://gist.github.com/alexandrusavin/2d2a91fcc35faf1c9f828b350e13c3bd


Warning: All messages under 140 characters will get posted to Twitter. Only use a channel designated to post tweets from.

Environment Variables
====

SLACK_POST_CHANNEL=twitter_post
SLACK_TOKEN=<YOUR SLACK BOT TOKEN>
TWITTER_CONSUMER_KEY=<YOUR TWITTER CONSUMER KEY>
TWITTER_CONSUMER_SECRET=<YOUR TWITTER CONSUMER SECRET>
TWITTER_ACCESS_TOKEN_KEY=<YOUR TWITTER ACCESS KEY>
TWITTER_ACCESS_TOKEN_SECRET=<YOUR TWITTER ACCESS SECRET>
TWITTER_HANDLE="<YOUR TWITTER HANDLE>"
TMP_PATH=<TEMP DIRECTORY RELATIVE PATH>
Usage
====

1. Posting messages to the 'twitter_post' channel will evaluate whether the tweet meets Twitter's definition of 140 characters. That means that URLs are compressed down (and possibly up?) to be either 23 or 24 characters in length. You don't have to short URLs. (You don't have to in general either, not even for analytics, since http://analytics.twitter.com/ handles that now.)

Known Issues
====

