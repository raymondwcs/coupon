const Coupon = artifacts.require("Coupon");

contract("1st Coupon test", async accounts => {
    it("award 1 coupon to first account, 1 coupon to second account", async () => {
        let instance = await Coupon.deployed()

        console.log(`owner: ${await instance.owner()}`)
        console.log(`accounts: ${accounts[0]}`)

        await instance.awardCoupon(accounts[0], "http://example.com/coupon/50")
        await instance.awardCoupon(accounts[1], "http://example.com/coupon/50")

        let totalSupply = await instance.totalSupply()
        let acc0 = await instance.balanceOf(accounts[0])
        let acc1 = await instance.balanceOf(accounts[1])

        assert.equal(totalSupply, 2)
        assert.equal(acc0, 1);
    })

    /*
    it("should put 10000 MetaCoin in the first account", async () => {
        let instance = await MetaCoin.deployed();
        let balance = await instance.getBalance.call(accounts[0]);
        assert.equal(balance.valueOf(), 10000);
    });

    it("should call a function that depends on a linked library", async () => {
        let meta = await MetaCoin.deployed();
        let outCoinBalance = await meta.getBalance.call(accounts[0]);
        let metaCoinBalance = outCoinBalance.toNumber();
        let outCoinBalanceEth = await meta.getBalanceInEth.call(accounts[0]);
        let metaCoinEthBalance = outCoinBalanceEth.toNumber();
        assert.equal(metaCoinEthBalance, 2 * metaCoinBalance);
    });

    it("should send coin correctly", async () => {
        // Get initial balances of first and second account.
        let account_one = accounts[0];
        let account_two = accounts[1];

        let amount = 10;

        let instance = await MetaCoin.deployed();
        let meta = instance;

        let balance = await meta.getBalance.call(account_one);
        let account_one_starting_balance = balance.toNumber();

        balance = await meta.getBalance.call(account_two);
        let account_two_starting_balance = balance.toNumber();
        await meta.sendCoin(account_two, amount, { from: account_one });

        balance = await meta.getBalance.call(account_one);
        let account_one_ending_balance = balance.toNumber();

        balance = await meta.getBalance.call(account_two);
        let account_two_ending_balance = balance.toNumber();

        assert.equal(
            account_one_ending_balance,
            account_one_starting_balance - amount,
            "Amount wasn't correctly taken from the sender"
        );
        assert.equal(
            account_two_ending_balance,
            account_two_starting_balance + amount,
            "Amount wasn't correctly sent to the receiver"
        );
    });
    */
});