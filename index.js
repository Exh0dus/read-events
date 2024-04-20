const { TwitterApi } = require('twitter-api-v2');
const { getContractEvents, getTotalStakedBalance } = require('./blockChain.js');
const { groupData, toMarkdown, writeToFile } = require('./digest.js');
const { formatTweets, storeObject, loadObject } = require('./utils.js');
const { pushToGit, getLatestWorkflowStatus } = require('./git.js');
require('dotenv').config();

const TWITTER_AUTH = {
    appKey: process.env.twitter_appKey,
    appSecret: process.env.twitter_appSecret,
    accessToken: process.env.twitter_accessToken,
    accessSecret: process.env.twitter_accessSecret,
}

const client = new TwitterApi(TWITTER_AUTH);

async function main() {
  
   // getContractEvents().then(data => storeObject(data, './allEvents.json'));
    loadObject('./allEvents.json').then(groupData).then(toMarkdown).then(result => writeToFile("./Digest/docs/"+result.filename, result.markdown));


    //await getContractEvents().then(groupData).then(toMarkdown).then(md => writeToFile("./Digest/docs/test.md", md));
    //pushToGit("commit message");
    //const result = await waitForWorkflowCompletion(); // if the result is 'failure' use the link to the .md instead of the page
    //client.v2.tweet('Hello World');
    //console.log(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
}

main().catch(console.error);

// add logging 
// connect things together



//getContractEvents().then(storeAllEvents());

//getContractEvents().then(console.log).catch(console.error);

//loadAllEvents().then(groupData).then(toMarkdown).then(md => writeToFile("./Digest/docs/test.md", md)).then(pushToGit)

//loadAllEvents().then(formatTweets).then(res => {res.depositTweets.slice(10,14).forEach(tweet => client.v2.tweet(tweet))}).catch(console.error)

//getLatestWorkflowStatus().then(console.log).catch(console.error);
//getWorkflows().then(console.log).catch(console.error);



