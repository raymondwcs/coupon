// contracts/Coupon.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

////Import Auth from the access-control subdirectory
////import "./access-control/Auth.sol";

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coupon is Ownable, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    ////Auth private auth;

    ////constructor(Auth _auth) public ERC721("Coupon", "CPN") {
    constructor() public ERC721("Coupon", "CPN") {
        ////auth = _auth;
    }

    function awardCoupon(address customer, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        ////Require that the caller is registered as an administrator in Auth
        ////require(auth.isAdministrator(msg.sender), "Unauthorized");

        _tokenIds.increment();

        uint256 newCouponId = _tokenIds.current();
        _mint(customer, newCouponId);
        _setTokenURI(newCouponId, tokenURI);

        return newCouponId;
    }
}