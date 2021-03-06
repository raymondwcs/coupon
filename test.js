// scripts/index.js
module.exports = async function main(callback) {
    try {
        // Our code will go here

        const accounts = await web3.eth.getAccounts()
        const Coupon = artifacts.require("Coupon")
        const coupon = await Coupon.deployed()

        console.log(`owner(): ${await coupon.owner()}`)
        let results = await coupon.awardCoupon(accounts[0], "http://erc721-metadata.s3.amazonaws.com/coupons/coupon-50.json", { from: accounts[0] })
        console.log(`totalSupply(): ${await coupon.totalSupply()}`)

        for (let i = 0; i < await coupon.totalSupply(); i++) {
            let tokenId = await coupon.tokenByIndex(i)
            let c = await coupon.coupons(tokenId)
            // console.log(JSON.stringify(c))
            console.log(`${tokenId} = ${c.redeemed}`)
        }

        try {
            await coupon.redeem(1)
        } catch (error) {
            console.log(error.message)
        }

        for (let i = 0; i < await coupon.totalSupply(); i++) {
            let tokenId = await coupon.tokenByIndex(i)
            let c = await coupon.coupons(tokenId)
            // console.log(JSON.stringify(c))
            console.log(`${tokenId} = ${c.redeemed}`)
        }

        // let myCoupons = await coupon.myCoupons()
        // console.log(`myCoupons(): ${myCoupons.toString()}`)

        callback(0);
    } catch (error) {
        console.error(error);
        callback(1);
    }
}