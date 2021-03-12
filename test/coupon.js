const Coupon = artifacts.require("Coupon");

contract("1st Coupon test", async accounts => {
    it("award 1 coupon to account[0], 1 coupon to account[1]", async () => {
        let instance = await Coupon.deployed()

        console.log(`owner: ${await instance.owner()}`)
        console.log(`accounts: ${accounts[0]}`)

        await instance.awardCoupon(accounts[0], "http://example.com/coupon/50")
        await instance.awardCoupon(accounts[1], "http://example.com/coupon/50")

        let totalSupply = await instance.totalSupply()
        let acc0 = await instance.balanceOf(accounts[0])
        let acc1 = await instance.balanceOf(accounts[1])

        assert.equal(totalSupply, 2)
        assert.equal(acc0, 1)
        assert.equal(acc1, 1)
    })

    it("account[0] redeems 1 coupon", async () => {
        let instance = await Coupon.deployed()

        let totalSupply = await instance.totalSupply()
        let myCoupons = await instance.getMyCoupons()
        let acc0 = await instance.balanceOf(accounts[0])
        assert.equal(acc0, 1)
        assert.equal(myCoupons.length, 1)

        var i = 0;
        while (i < myCoupons.length) {
            // let tokenId = await instance.tokenByIndex(i)
            let tokenId = myCoupons[i].tokenId
            if (await instance.ownerOf(tokenId) == accounts[0]) {
                await instance.redeem(tokenId)
                break;
            }
            i++
        }

        myCoupons = await instance.getMyCoupons()
        assert.equal(myCoupons[i].redeemed, true)
    })
});