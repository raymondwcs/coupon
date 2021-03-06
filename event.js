// truffle exec --network ganache event.js <<Arificats>>

module.exports = async function main(callback) {
    try {
        if (!process.argv[6]) {
            console.log(`missing abi!`)
            callback(1)
        }
        const accounts = await web3.eth.getAccounts()
        const Contract = artifacts.require(process.argv[6]) // need this to run!
        const instance = await Contract.deployed()

        console.log(`Contract address: ${instance.address}`)
        console.log(`accounts[]:`)
        console.log(accounts)

        let currentBlockNumber = await web3.eth.getBlockNumber()
        console.log(`Current block number: ${currentBlockNumber}`)

        // from block 0 to current block
        for (let block = 0; block <= currentBlockNumber; block++) {
            // get the numner of transaction in a block
            console.log(`** Block [${block}]`)
            let nTx = await web3.eth.getBlockTransactionCount(block)
            console.log(`Number of transaction(s) in block [${block}]: ${nTx}`)
            // get each transaction in a block
            for (let i = 0; i < nTx; i++) {
                let tx = await web3.eth.getTransactionFromBlock(block, i)
                // console.log(`getTransactionFromBlock(${block},${i}): ${JSON.stringify(tx)}`)
                let txReceipt = await web3.eth.getTransactionReceipt(tx.hash)
                // console.log(txReceipt)
                if (txReceipt.logs.length == 0) {
                    console.log(`getTransactionReceipt(${tx.hash}).logs is empty!\ntxReceipt:`)
                    console.log(txReceipt)
                }
                for (log of txReceipt.logs) {
                    for (f of Contract.abi) {
                        if (log.topics[0] === f.signature) {  // match `topics' against abi
                            console.log(`Name: '${f.name}', type: ${f.type}`)
                            try {
                                let topics = (f.anonymous) ? log.topics : log.topics.slice(1)
                                var event = await web3.eth.abi.decodeLog(
                                    f.inputs, log.data, topics
                                )
                                console.log(event)
                            } catch (error) {
                                console.error(error)
                                console.log(f.inputs)
                                console.log(log.data)
                                console.log(log.topics)
                            }
                        }
                        continue
                    }
                }
            }
        }
        callback(0);
    } catch (error) {
        console.error(error);
        callback(1);
    }
}
