import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'

var web3 = null
const getWeb3 = () => {
    return new Promise(async (resolve, reject) => {
        if (process.env.REACT_APP_USE_METAMASK === "true") {
            const provider = await detectEthereumProvider()
            // From now on, this should always be true:
            // provider === window.ethereum
            if (provider) {
                console.log('Injected web3 detected.');
                web3 = new Web3(provider)
                try {
                    await provider.request({ method: 'eth_requestAccounts' });
                } catch (error) {
                    console.error(error);
                }
            }
        } else {
            const Web3HttpProvider = require('web3-providers-http');
            require('dotenv').config({ path: "../.env" })
            const provideURL =
                (process.env.REACT_APP_PROVIDER_URL) ? process.env.REACT_APP_PROVIDER_URL : 'http://localhost:8545'
            const customProvider = new Web3HttpProvider(provideURL)
            web3 = new Web3(customProvider)
        }

        if (web3) {
            const accounts = await web3.eth.getAccounts()
            const network = await getNetwork(web3)
            const results = {
                web3: web3,
                accounts: accounts,
                network: network,
            }
            return resolve(results)
        } else {
            return reject(new Error("web3 error: web3 is null!"))
        }
    })
}

const getNetwork = (web3) => {
    return new Promise(async (resolve, reject) => {
        try {
            let network = {}
            network['id'] = await web3.eth.net.getId()
            network['networkType'] = await web3.eth.net.getNetworkType()
            return resolve(network)
        } catch (error) {
            return reject(new Error(error))
        }
    })
}

export default getWeb3
