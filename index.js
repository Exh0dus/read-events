const { TwitterApi } = require('twitter-api-v2');
const { getContractEvents } = require('./blockChain.js');
const { groupData, toMarkdown, writeToFile } = require('./digest.js');
const { loadAllEvents, formatTweets } = require('./utils.js');
require('dotenv').config();

const TWITTER_AUTH = {
    appKey: process.env.twitter_appKey,
    appSecret: process.env.twitter_appSecret,
    accessToken: process.env.twitter_accessToken,
    accessSecret: process.env.twitter_accessSecret,
}

const client = new TwitterApi(TWITTER_AUTH);




//getContractEvents().then(storeAllEvents());

//getContractEvents().then(console.log).catch(console.error);

//loadAllEvents().then(groupData).then(toMarkdown).then(md => writeToFile("./journal.md", md)).then(console.log)

//loadAllEvents().then(formatTweets).then(res => {res.depositTweets.slice(10,14).forEach(tweet => client.v2.tweet(tweet))}).catch(console.error)
