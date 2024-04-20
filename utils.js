const fs = require('fs');
require('dotenv').config();

async function storeAllEvents(allEvents) {
    storeObject(allEvents, './allEvents.json');
    return allEvents.length;
}

async function loadAllEvents() {
    return loadObject('./allEvents.json');
}

async function storeObject(object, filePath) {
    fs.writeFile(filePath, JSON.stringify(object, null, 2), (err) => {
        if (err) console.log(err);
    });
}

async function loadObject(filePath) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

function formatTweets(allEvents) {
    const transactionPrefix = "https://etherscan.io/tx/"
    const depositTweets = [];
    const withdrawTweets = [];

    for (const event of allEvents) {
        const tweet = `• ${formatAddress(event.address)} ${event.type} ${ Number(event.amount).toPrecision(6)} ${event.token} in ${transactionPrefix+event.transaction}`;
        if (event.type === 'deposited') {
            depositTweets.push(tweet);
        } else {
            withdrawTweets.push(tweet);
        }
    }
    
    function formatAddress(address) {
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    return {depositTweets, withdrawTweets};
}

module.exports = { formatTweets, loadAllEvents, storeAllEvents, storeObject, loadObject};