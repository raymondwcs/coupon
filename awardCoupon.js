// const TOKEN_URI = "https://erc-721.s3.amazonaws.com/uri/coupon-50.json"
const TOKEN_URI = "https://gateway.pinata.cloud/ipfs/QmdZi6YhkLCQFwDyyE5BzTPD5SCB5H889uJ5Qsy4gcLiCE"

module.exports = async function main(callback) {
    try {
        const accounts = await web3.eth.getAccounts()
        const Coupon = artifacts.require("Coupon")
        const coupon = await Coupon.deployed()

        console.log(`Contract owner: ${await coupon.owner()}`)

        for (let i = 0; i < 5; i++) {
            await coupon.awardCoupon(accounts[0], TOKEN_URI, { from: accounts[0] })
            await coupon.awardCoupon(accounts[1], TOKEN_URI, { from: accounts[0] })
        }

        console.log(`totalSupply(): ${await coupon.totalSupply()}`)

        for (let i = 0; i < await coupon.totalSupply(); i++) {
            let tokenId = await coupon.tokenByIndex(i)
            let c = await coupon.coupons(tokenId)
            console.log(`${tokenId}.redeemed = ${c.redeemed}`)
        }

        // try {
        //     await coupon.redeem(1)
        // } catch (error) {
        //     console.log(error.message)
        // }

        callback(0);
    } catch (error) {
        console.error(error);
        callback(1);
    }
}