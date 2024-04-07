const ethers = require('ethers');
const contractData = require('./contract.json');
require('dotenv').config();

const infuraUrl = `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(infuraUrl);
const contract = new ethers.Contract(contractData.address, contractData.abi, provider);


const eventNames = ['Deposit', 'Withdraw']; 
const fromBlock = 19604459;

async function getContractEvents() {
    try {
        let allEvents = [];

        for (const eventName of eventNames) {
            const filter = contract.filters[eventName]();

            const events = await contract.queryFilter(filter, fromBlock, 'latest');
            const mappedEvents = await Promise.all(events.map(mapEventValues));
            allEvents = allEvents.concat(mappedEvents);
        }

        console.log('All Events:', allEvents);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}


async function mapEventValues(event) {
    const address = event.args[getType(event.event)];
    const ens = await lookUpAddress(address);
    return {
        address: address,
        addressEns: ens,
        type: getType(event.event).slice(0, -2),
        token: lookUpToken(event.args.token),
        amount: ethers.utils.formatUnits(event.args.amount, 18), //assuming that the staking tokens have the same digits as ether  
        transaction: event.transactionHash,
        blockNumber: event.blockNumber,
        eventId: event.args.eventId.toString()
    }
}

function getType(eventType) {
    return eventType.includes('Withdraw') ? "withdrawer" : "depositor";
}

function lookUpToken(tokenAddr) {
    //gonna need a lookup for the different possible staking coins
    return tokenAddr;
}

async function lookUpAddress(tokenAddr) {
    try {
        const ensName = await provider.lookupAddress(tokenAddr);
        return ensName;
    } catch (error) {
        console.error('Error resolving ENS name:', error);
        return tokenAddr;
    }
}

getContractEvents();