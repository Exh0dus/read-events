const fs = require('fs');

async function storeAllEvents(allEvents) {
    fs.writeFile('./allEvents.json', JSON.stringify(allEvents, null, 2), (err) => {
        if (err) console.log(err);
    });

    return allEvents.length;
}

async function loadAllEvents() {
    const data = await fs.promises.readFile('./allEvents.json', 'utf8');
    const allEvents = JSON.parse(data);
    return allEvents;
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

module.exports = { formatTweets, loadAllEvents, storeAllEvents };