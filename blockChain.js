const ethers = require('ethers');
const contractData = require('./contract.json');
const fs = require('fs');
const { storeObject, loadObject } = require('./utils');

require('dotenv').config();

const TokenNameLookup = {
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ETH',
    '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110': 'ezETH',
    '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee': 'weETH',
    '0xD9A442856C234a39a81a089C06451EBAa4306a72': 'pufETH',
    '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3': 'USDe',
    '0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7': 'rsETH',
    '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0': 'wstETH',
    '0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549': 'LsETH',
    '0x49446A0874197839D15395B908328a74ccc96Bc0': 'mstETH',
    '0xf951E335afb289353dc249e82926178EaC7DEd78': 'swETH',
    '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa': 'mETH',
    '0xE46a5E19B19711332e33F33c2DB3eA143e86Bc10': 'mwBETH',
    '0x32bd822d615A3658A68b6fDD30c2fcb2C996D678': 'mswETH',
    '0x4d831e22F062b5327dFdB15f0b6a5dF20E2E3dD0': 'cSTONE',
    '0x18f313Fc6Afc9b5FD6f0908c1b3D476E3feA1DD9': 'egETH',
    '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0': 'rswETH',
    '0x6ef3D766Dfe02Dc4bF04aAe9122EB9A0Ded25615': 'primeETH',
  };

const eventNames = ['Deposit', 'Withdraw']; 
const infuraUrl = `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
const stateFilePath = './Digest/state.json';
const provider = new ethers.providers.JsonRpcProvider(infuraUrl);
const contract = new ethers.Contract(contractData.address, contractData.abi, provider);
const ensCache = new Map();


async function getContractEvents() {
    try {
        let allEvents = [];
        const lastState = await loadObject(stateFilePath);

        for (const eventName of eventNames) {
            const filter = contract.filters[eventName]();
            console.info(`Fetching ${eventName} events...`);

            const events = await contract.queryFilter(filter, Number.parseInt(lastState.BlockNumber), 'latest');
            console.info(`Mapping ${events.length} ${eventName} events...`);
            const mappedEvents = await Promise.all(events.filter(evt => evt.args.eventId > lastState.EventNumber).map(mapEventValues));
            allEvents = allEvents.concat(mappedEvents);
        }

        allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
        const { highestBlockNumber, highestEventId } = getHighestBlockNumberAndEventId(allEvents);
        const tvl = await getTotalStakedBalance();
        const currentState = { BlockNumber: highestBlockNumber, EventNumber: highestEventId, Tvl: tvl, DateEst: new Date().toLocaleString("en-US", {timeZone: "America/New_York"}) };
        await storeObject(currentState, stateFilePath);

        return {lastState, currentState, events: allEvents};
    } catch (error) {
        console.error('Error fetching events:', error);
        return {lastState: null, currentState: null, events: []};
    }
}


async function mapEventValues(event) {
    const address = event.args[getType(event.event)];
    //Ens lookup keeps reverting without reason, so it's disabled for now 
    const ens = null; // await lookUpAddress(address);

    return {
        address: address,
        addressEns: ens,
        type: getTransactionType(event.event),
        tokenAddr: event.args.token,
        token: TokenNameLookup[event.args.token],
        amount: ethers.utils.formatUnits(event.args.amount, 18),
        transaction: event.transactionHash,
        blockNumber: event.blockNumber,
        eventId: event.args.eventId.toString()
    }
}

function getHighestBlockNumberAndEventId(allEvents) {
    return allEvents.reduce((acc, event) => {
        return {
            highestBlockNumber: Math.max(acc.highestBlockNumber, Number(event.blockNumber)),
            highestEventId: Math.max(acc.highestEventId, Number(event.eventId))
        };
    }, { highestBlockNumber: 0, highestEventId: 0 });
}

function getTransactionType(eventType) {
    return eventType.includes('Withdraw') ? "withdrawn" : "deposited";
}


function getType(eventType) {
    return eventType.includes('Withdraw') ? "withdrawer" : "depositor";
}

async function lookUpAddress(walletAddr) {
    if (ensCache.has(walletAddr)) {
        return ensCache.get(walletAddr);
    }

    try {
        const ensName = await provider.lookupAddress(walletAddr);
        ensCache.set(walletAddr, ensName);
        return ensName;
    } catch (error) {
        console.error('Error resolving ENS name:', error);
        return null;
    }
}


async function getTotalStakedBalance() {
    let totalBalanceUSD = 0;
    const erc20Interface = new ethers.utils.Interface([
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
    ]);
    const ethPrice = await getUSDPrice('ETH');


    for (const tokenAddress of Object.keys(TokenNameLookup)) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, erc20Interface, provider);
            const balance = await tokenContract.balanceOf(contractData.address);
            const decimals = await tokenContract.decimals();

            if (TokenNameLookup[tokenAddress] === 'USDe') {
                totalBalanceUSD += Number.parseFloat(ethers.utils.formatUnits(balance, decimals));

                
            } else {
                totalBalanceUSD += Number.parseFloat(ethers.utils.formatUnits(balance, decimals)) * ethPrice;
            }

        
        } catch (error) {
            console.error(`Error fetching balance for token: ${tokenAddress}`, error);
        }
    }

    return totalBalanceUSD;
}

async function getUSDPrice(tokenSymbol) {
    const url = `https://min-api.cryptocompare.com/data/price?fsym=${tokenSymbol}&tsyms=USD`;

    const response = await fetch(url);
    const data = await response.json();
    if (data.Response === 'Error') {
        console.error(`Error fetching price for token: ${tokenSymbol} ${JSON.stringify(data)}`);
        return 0;
    }

    return Number.parseFloat(data.USD);
}

module.exports = { getContractEvents, getTotalStakedBalance };