// scripts/index.js
module.exports = async function main(callback) {
    try {
        const accounts = await web3.eth.getAccounts()
        const Coupon = artifacts.require("Coupon")
        const coupon = await Coupon.deployed()

        console.log(`Contract owner: ${await coupon.owner()}`)

        for (let i = 0; i < 5; i++) {
            await coupon.awardCoupon(accounts[0], "http://example.com/coupons/50.json", { from: accounts[0] })
        }
        await coupon.awardCoupon(accounts[1], "http://example.com/coupons/50.json", { from: accounts[0] })

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