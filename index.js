const loggers = require('./logger.js');
const { TwitterApi } = require('twitter-api-v2');
const { getContractEvents } = require('./blockChain.js');
const { groupData, toMarkdown, writeToFile } = require('./digest.js');
const { formatTweet } = require('./utils.js');
const { gitPushDigest, gitPull, waitForWorkflowCompletion } = require('./git.js');

require('dotenv').config();

const client = new TwitterApi({
    appKey: process.env.twitter_appKey,
    appSecret: process.env.twitter_appSecret,
    accessToken: process.env.twitter_accessToken,
    accessSecret: process.env.twitter_accessSecret,
});

async function main() {
    gitPull('./', process.env.MAIN_REPO, 'prod');
    gitPull('./Digest', process.env.DIGEST_REPO);

    const data = await getContractEvents().then(groupData);
    const digest = toMarkdown(data);
    writeToFile("./Digest/docs/" + digest.filename, digest.markdown);
    gitPushDigest("Adding new digest at "+new Date());
    const result = await waitForWorkflowCompletion(); // if the result is 'failure' use the link to the .md instead of the page
    await client.v2.tweet(formatTweet(data, digest.filename, result === "success"));

    process.exit(0);
}

main().catch(console.error);



