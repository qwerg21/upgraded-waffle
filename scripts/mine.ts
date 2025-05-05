import {Address, TonClient, toNano} from '@ton/ton';
import { unixNow } from '../lib/utils';
import { MineMessageParams, Queries } from '../wrappers/NftGiver';
import { NetworkProvider } from '@ton/blueprint';

const walletAddress = Address.parse('0QDZc-I34wx76zL5U6bj7cHUsx5imSSCUTP_Hn40Tjwn51oy');
const collectionMinerAddress = Address.parse('EQDk8N7xM5D669LC2YACrseBJtDyFqwtSPCNhRWXU7kjEptX');

async function mine () {
// specify endpoint for Testnet
    const endpoint = "https://testnet.toncenter.com/api/v2/jsonRPC"
    
    // initialize ton library
    const client = new TonClient({ endpoint });

    // ... previous code

    const miningData = await client.runMethod(collectionMinerAddress, 'get_mining_data');
    
    // ... previous code

const { stack } = miningData;

const complexity = stack.readBigNumber();
const lastSuccess = stack.readBigNumber();
const seed = stack.readBigNumber();
const targetDelta = stack.readBigNumber();
const minCpl = stack.readBigNumber();
const maxCpl = stack.readBigNumber();



// ... previous code

const mineParams: MineMessageParams = {
    expire: unixNow() + 300, // 5 min is enough to make a transaction
    mintTo: walletAddress, // your wallet
    data1: 0n, // temp variable to increment in the miner
    seed // unique seed from get_mining_data
};

let msg = Queries.mine(mineParams); // transaction builder
let progress = 0;

const bufferToBigint = (buffer: Buffer) => BigInt('0x' + buffer.toString('hex'));

while (bufferToBigint(msg.hash()) > complexity) {
    console.clear()
    console.log(`Mining started: please, wait for 30-60 seconds to mine your NFT!`)
    console.log()
    console.log(`⛏ Mined ${progress} hashes! Last: `, bufferToBigint(msg.hash()))

    mineParams.expire = unixNow() + 300;
    mineParams.data1 += 1n;
    msg = Queries.mine(mineParams);
    progress++
}

console.log()
console.log('💎 Mission completed: msg_hash less than pow_complexity found!');
console.log()
console.log('msg_hash:       ', bufferToBigint(msg.hash()))
console.log('pow_complexity: ', complexity)
console.log('msg_hash < pow_complexity: ', bufferToBigint(msg.hash()) < complexity);

return msg;
}

export async function run(provider: NetworkProvider) {
    // Do not forget to return `msg` from `mine()` function
    const msg = await mine();

    await provider.sender().send({
        to: collectionMinerAddress,
        value: toNano(0.05),
        body: msg
    });
}