// scripts/index.js
module.exports = async function main(callback) {
    try {
        // Our code will go here

        const accounts = await web3.eth.getAccounts()
        const Coupon = artifacts.require("Coupon")
        const coupon = await Coupon.deployed()

        console.log(`owner(): ${await coupon.owner()}`)
        let results = await coupon.awardCoupon(accounts[0], "https://example.com/coupon/10", { from: accounts[0] })
        console.log(`totalSupply(): ${await coupon.totalSupply()}`)

        for (let i = 0; i < await coupon.totalSupply(); i++) {
            let tokenId = await coupon.tokenByIndex(i)
            console.log(`redeemed(${tokenId}) = ${await coupon.redeemed(tokenId)} `)
        }

        try {
            await coupon.redeemCoupon(1)
        } catch (error) {
            console.log(error.message)
        }

        for (let i = 0; i < await coupon.totalSupply(); i++) {
            let tokenId = await coupon.tokenByIndex(i)
            console.log(`redeemed(${tokenId}) = ${await coupon.redeemed(tokenId)} `)
        }

        // let myCoupons = await coupon.myCoupons()
        // console.log(`myCoupons(): ${myCoupons.toString()}`)

        callback(0);
    } catch (error) {
        console.error(error);
        callback(1);
    }
}