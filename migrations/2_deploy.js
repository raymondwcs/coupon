const Coupon = artifacts.require("Coupon");

module.exports = function (deployer) {
    deployer.deploy(Coupon);
};
