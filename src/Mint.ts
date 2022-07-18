import Web3 from "web3";
import * as datenv from "dotenv";
import {AbiItem} from "web3-utils";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
datenv.config();


const mintCompoundEthToken = async():Promise<any>=>{

    try {

        const web3 = new Web3(new Web3.providers.HttpProvider(process.env.rpcRopstenURL));

        const mintABI =  require("../ABI/CompoundABI");

        const mintContract =  new web3.eth.Contract(mintABI as AbiItem[], process.env.cEthRopstenAddress);

        const activeAccount = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

        const chain =  new Common({chain:'ropsten' , hardfork: 'london'});

        const privateKeyBuffer = Buffer.from(process.env.PRIVATE_KEY.replace('0x',''),'hex');

        const txNonce = await web3.eth.getTransactionCount(activeAccount.address, 'pending');

        const encode_tx = mintContract.methods.mint().encodeABI();

         //@ts-ignore
        const baseGas = web3.utils.hexToNumber((await web3.eth.getBlock("latest")).baseFeePerGas);

        const maxFeesPerGas = (baseGas*2)+2;

        const rawTx = {

            "to"                    :   web3.utils.toHex( process.env.cEthRopstenAddress ), //Contract Address
            "gasLimit"              :   web3.utils.toHex( 4300000 ),
            "maxFeePerGas"          :   web3.utils.toHex( web3.utils.toWei(String(maxFeesPerGas), 'gwei' ) ),
            "maxPriorityFeePerGas"  :   web3.utils.toHex( web3.utils.toWei( '2' , 'gwei' ) ),
            "value"                 :   web3.utils.toHex( web3.utils.toWei( '0.0001' , 'ether' ) ),
            "data"                  :   encode_tx,
            "nonce"                 :   web3.utils.toHex( txNonce ),
            "chainId"               :   "0x03",
            //"accessList"          :   [],
            "type"                  :   "mint" //"0x02"

        }

        const tx = FeeMarketEIP1559Transaction.fromTxData(rawTx,{chain});

        const signedTx = tx.sign(privateKeyBuffer);

        const serializeTransaction = '0x' + signedTx.serialize().toString('hex');

        const hash = await web3.utils.sha3(serializeTransaction);
        console.log("Hash : ", hash);

        const walletBalance = await web3.eth.getBalance(activeAccount.address);

        console.log("Wallet Balance :", walletBalance);

        await web3.eth.sendSignedTransaction(serializeTransaction)
        .on('error', function (error) {
            console.error(error);
        })
        .on('confirmation',async (confirationNumber:number, receipt) => {
            
            console.log("Confirmation Number: ", confirationNumber);

            console.log("Receipt: ", receipt);
            
        })
        .on('receipt',async (txReceipt) => {

            console.log("signAndSendTx txReceipt. Tx Address: " + txReceipt.transactionHash);
        })

 
    } catch (error) {
        
    }

}
mintCompoundEthToken().then((resolve)=>console.log("Script Complete")).catch((error)=>{
    console.log("Error",error);
    process.exitCode=1;
})