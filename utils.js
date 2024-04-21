const fs = require('fs');
require('dotenv').config();

async function storeObject(object, filePath) {
    fs.writeFile(filePath, JSON.stringify(object, null, 2), (err) => {
        if (err) console.log(err);
    });
}

async function loadObject(filePath) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

function formatTweet(transactions, filename, success) {
    const link = success 
        ? "https://zircatsteak.github.io/Digest/"+filename.slice(0, -3)
        : "https://github.com/ZircatSteak/Digest/blob/main/docs/"+filename;
        
    const tvl = transactions.currentState.Tvl;
    const period = (new Date(transactions.currentState.DateEst) - new Date(transactions.lastState.DateEst));
    const delta = transactions.lastState.Tvl - transactions.currentState.Tvl;
    const isIncrease = delta > 0;
    const depositCount = Array.from(transactions.maps.Deposits.values()).reduce((total, currentArray) => total + currentArray.length, 0);
    const withdrawCount = Array.from(transactions.maps.Withdrawals.values()).reduce((total, currentArray) => total + currentArray.length, 0);

    return `🚀 Zircuit Staking Update 🚀

    In the past ${Math.floor(period / 1000 / 60)} minutes:
    🔹 ${depositCount} deposits
    🔸 ${withdrawCount} withdrawals
    💰 TVL ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(delta).toLocaleString('en-US', { maximumFractionDigits: 3 })} USD

    🔐 TVL: ${Number(tvl).toLocaleString('en-US', { maximumFractionDigits: 3 })} USD

    📊 Dive deeper here: ${link}`;
}

module.exports = { formatTweet, storeObject, loadObject};