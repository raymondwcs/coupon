const Coupon = artifacts.require("Coupon");

// Import utilities from Test Helpers
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TOKEN_URI = "https://erc-721.s3.amazonaws.com/uri/coupon-50.json"

contract("1st Coupon test", async accounts => {
    it("award 1 coupon to account[0], 1 coupon to account[1]", async () => {
        let instance = await Coupon.deployed()

        console.log(`owner: ${await instance.owner()}`)
        console.log(`accounts: ${accounts[0]}`)

        let receipt = await instance.awardCoupon(accounts[0], TOKEN_URI)
        expectEvent(receipt, 'awardCouponEvent', {
            customer: accounts[0],
            tokenURI: TOKEN_URI,
        })

        await instance.awardCoupon(accounts[1], TOKEN_URI)

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
                let receipt = await instance.redeem(tokenId)
                expectEvent(receipt, 'redeemCouponEvent', {
                    customer: accounts[0],
                    tokenId: tokenId,
                    tokenURI: TOKEN_URI
                })
                myCoupons = await instance.getMyCoupons()
                assert.equal(myCoupons[i].redeemed, true)
                break;
            }
            i++
        }
    })

    it("account[0] redeems a coupon owned by account[1]", async () => {
        let instance = await Coupon.deployed()

        let myCoupons = await instance.getMyCoupons({ from: accounts[1] })
        let acc1 = await instance.balanceOf(accounts[1])
        assert.equal(acc1, 1)
        assert.equal(myCoupons.length, 1)

        let tokenId = myCoupons[0].tokenId
        await expectRevert(instance.redeem(tokenId, { from: accounts[0] }), "Not Owner")
    })

    it("account[0] transfers one of her coupons to account[1]", async () => {
        let instance = await Coupon.deployed()

        let myCoupons = await instance.getMyCoupons({ from: accounts[0] })
        let tokenToBeTransferred = myCoupons[0].tokenId
        console.log(`transfer token ${tokenToBeTransferred} from ${accounts[0]} to ${accounts[1]}}`)
        let receipt = await instance.safeTransferFrom(accounts[0], accounts[1], tokenToBeTransferred)
        expectEvent(receipt, 'Transfer', {
            from: accounts[0],
            to: accounts[1],
            tokenId: tokenToBeTransferred,
        })
        assert(instance.ownerOf(tokenToBeTransferred), accounts[1])
    })

});