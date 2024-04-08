const ethers = require('ethers');
const contractData = require('./contract.json');
const readLastLines = require('read-last-lines');
const fs = require('fs');
require('dotenv').config();

const TokenNameLookup = {
    '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee': 'weETH',
    '0x4d831e22F062b5327dFdB15f0b6a5dF20E2E3dD0': 'cSTONE',
    '0xf951E335afb289353dc249e82926178EaC7DEd78': 'swETH',
    '0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7': 'rsETH',
    '0xD9A442856C234a39a81a089C06451EBAa4306a72': 'pufETH',
    '0x32bd822d615A3658A68b6fDD30c2fcb2C996D678': 'mswETH',
    '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110': 'ezETH',
    '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0': 'rswETH',
    '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3': 'USDe',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ETH',
    '0x49446A0874197839D15395B908328a74ccc96Bc0': 'mstETH',
    '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0': 'wstETH',
    '0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549': 'LsETH',
    '0xE46a5E19B19711332e33F33c2DB3eA143e86Bc10': 'mwBETH'
  };

const eventNames = ['Deposit', 'Withdraw']; 
const lastBlockFile = './blockNumbers.txt';
const infuraUrl = `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(infuraUrl);
const contract = new ethers.Contract(contractData.address, contractData.abi, provider);


async function getContractEvents() {
    try {
        let allEvents = [];
        const fromBlock = await readLastLines.read(lastBlockFile, 1).catch(err => console.error(err));;

        for (const eventName of eventNames) {
            const filter = contract.filters[eventName]();

            const events = await contract.queryFilter(filter, Number.parseInt(fromBlock), 'latest');
            const mappedEvents = await Promise.all(events.map(mapEventValues));
            allEvents = allEvents.concat(mappedEvents);
        }

        allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
        storeLastBlockNumber(allEvents[allEvents.length - 1].blockNumber);
        return allEvents;
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}


async function mapEventValues(event) {
    const address = event.args[getType(event.event)];
    const ens = await lookUpAddress(address);

    return {
        address: address,
        addressEns: ens,
        type: getType(event.event).slice(0, -2),
        tokenAddr: event.args.token,
        token: TokenNameLookup[event.args.token],
        amount: ethers.utils.formatUnits(event.args.amount, 18), //assuming that the staking tokens have the same digits as ether  
        transaction: event.transactionHash,
        blockNumber: event.blockNumber,
        eventId: event.args.eventId.toString()
    }
}

function getType(eventType) {
    return eventType.includes('Withdraw') ? "withdrawer" : "depositor";
}

async function lookUpAddress(tokenAddr) {
    try {
        return await provider.lookupAddress(tokenAddr);
    } catch (error) {
        console.error('Error resolving ENS name:', error);
        return null;
    }
}

function storeLastBlockNumber(lastBlockNumber) {
    fs.appendFile(lastBlockFile, lastBlockNumber.toString()+ '\n', (err) => console.log(err));
}

getContractEvents().then(console.log).catch(console.error);
