const fs = require('fs');

function formatAddress(address) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

function groupData(data) {
    const withdrawGroups = new Map();
    const depositGroups = new Map();
    const {lastState, currentState, events} = data;

    for (const event of events) {
        
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

    return {maps: {Deposits: depositGroups, Withdrawals: withdrawGroups}, lastState, currentState};
}

function toMarkdown(data) {
    const addressPrefix = "https://etherscan.io/address/"
    const transactionPrefix = "https://etherscan.io/tx/"
    let  markdown = '';

    markdown += generateHeader(data);

    for (const property in data.maps) {
        markdown += `# ${property}\n`;
        const map = data.maps[property];
        for (const [key, values] of map.entries()) {
            markdown += `## ${key}\n`;
            for (const event of values) {
                markdown += `- ${formatWalletAddress(event)} ${event.type} ${Number(event.amount).toPrecision(6)} ${event.token} in ${formatTransaction(event)}\n`;
            }
        }
    }
    return {filename: `${data.lastState.BlockNumber}_${data.currentState.BlockNumber}.md`,  markdown};

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

function generateHeader(data) {
    return `# Zircuit transaction digest\n### ${data.lastState.DateEst} - ${data.currentState.DateEst}\n### Block ${data.lastState.BlockNumber} to ${data.currentState.BlockNumber}\n\n## Total Value Locked: ${data.currentState.Tvl.toPrecision(12)} USD\n\n`;
}


module.exports = { groupData, toMarkdown, writeToFile}