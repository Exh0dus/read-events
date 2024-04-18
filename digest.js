const fs = require('fs');

function formatAddress(address) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

function groupData(allEvents) {
    const withdrawGroups = new Map();
    const depositGroups = new Map();

    for (const event of allEvents) {
        
        if (event.type === 'deposited') {
           addToGroup(depositGroups, event);
        } else {
            addToGroup(withdrawGroups, event);
        }
    }
    
    function addToGroup(map, event) {
        if (map.has(event.token)) {
            map.get(event.token).push(event);
        } else {
            map.set(event.token, [event]);
        }
    }

    return {Deposits: depositGroups, Withdrawals: withdrawGroups};
}

function toMarkdown(maps) {
    const addressPrefix = "https://etherscan.io/address/"
    const transactionPrefix = "https://etherscan.io/tx/"
    let  markdown = '';
    for (const property in maps) {
        markdown += `# ${property}\n`;
        const map = maps[property];
        for (const [key, values] of map.entries()) {
            markdown += `## ${key}\n`;
            for (const event of values) {
                markdown += `- ${formatWalletAddress(event)} ${event.type} ${Number(event.amount).toPrecision(6)} ${event.token} in ${formatTransaction(event)}\n`;
            }
        }
    }
    return markdown;

    function formatWalletAddress(event) {
        return `[${event.addressEns || formatAddress(event.address)}](${addressPrefix+event.address})`;
    }

    function formatTransaction(event) {
        return `[${event.transaction.slice(0, 6) + '...' + event.transaction.slice(-4)}](${`${transactionPrefix}${event.address}`})`;
    }
    
}

function writeToFile(filename, data) {
    fs.writeFile(filename, data, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Successfully wrote to file');
        }
    });
}


module.exports = { groupData, toMarkdown, writeToFile}