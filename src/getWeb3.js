import Web3 from 'web3'
// import HDWalletProvider from '@truffle/hdwallet-provider'
const HDWalletProvider = require("@truffle/hdwallet-provider")
require('dotenv').config({ path: "../.env" })

let getWeb3 = new Promise(function (resolve, reject) {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    // window.addEventListener('load', function () {
    window.addEventListener('DOMContentLoaded', async () => {
        if (window.ethereum) {  // Metamask installed?
            let web3 = new Web3(window.ethereum);
            window.web3 = web3

            // let accounts = await window.ethereum.enable()
            let accounts = await web3.eth.getAccounts()
            let network = await getNetwork(web3)

            let results = {
                web3: window.web3,
                accounts: accounts,
                network: network
            }

            console.log('Injected web3 detected.');

            resolve(results)

        } else {
            // Use .env (env-sample as example) to determine provider
            // console.log(`MNEMONIC = ${process.env.REACT_APP_MNEMONIC}`)
            if (!process.env.REACT_APP_MNEMONIC || !process.env.REACT_APP_API_URL) {
                reject(new Error('getWeb3(): .env not found!'))
            }
            var provider = new HDWalletProvider({
                mnemonic: {
                    phrase: process.env.REACT_APP_MNEMONIC
                },
                providerOrUrl: process.env.REACT_APP_API_URL
            })

            let web3 = new Web3(provider)
            let accounts = await web3.eth.getAccounts()
            let network = await getNetwork(web3)
            console.log(`network: ${JSON.stringify(network)}`)

            let results = {
                web3: web3,
                accounts: accounts,
                network: network
            }

            console.log(`No web3 instance injected, using ${process.env.REACT_APP_API_URL}`);

            resolve(results)
        }
    })
})

const getNetwork = (web3) => {
    return new Promise(async (resolve, reject) => {
        let network = {}
        network['id'] = await web3.eth.net.getId()
        network['name'] = await web3.eth.net.getNetworkType()
        // console.log(`network: ${JSON.stringify(network)}`)

        resolve(network)
    })
}
export default getWeb3
