// contracts/Coupon.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coupon is Ownable, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CouponItem { 
        uint256 tokenId;
        string description;
        string expiryDate;
        uint value;
        bool redeemed;
        uint256 redeemedTimeStamp;
    }
    
    mapping (uint256 => CouponItem) public coupons;
    uint256 [] public tokenIds;

    constructor() public ERC721("Coupon", "CPN") {}

    event awardCouponEvent(address customer, uint256 tokenId, string tokenURI, uint256 blockTimeStamp);

    function awardCoupon(address customer, string memory tokenURI) public onlyOwner returns (uint256)
    {
        _tokenIds.increment();

        uint256 newCouponId = _tokenIds.current();
        _mint(customer, newCouponId);
        _setTokenURI(newCouponId, tokenURI);

        ////CouponItem memory c;
        ////c = CouponItem(newCouponId,"Cash Coupon","2022-12-31",50,false);

        coupons[newCouponId].tokenId = newCouponId;
        coupons[newCouponId].description = "Cash Coupon";
        coupons[newCouponId].expiryDate = "2022-12-31";
        coupons[newCouponId].value = 50;
        coupons[newCouponId].redeemed = false;
        tokenIds.push(newCouponId);
        
        emit awardCouponEvent(msg.sender, newCouponId, tokenURI, now);
        
        return newCouponId;
    }

    event redeemCouponEvent(address customer, uint256 tokenId, string tokenURI, uint256 blockTimeStamp);

    function redeem(uint256 tokenId) public { 
        require(ownerOf(tokenId) == msg.sender, "Not Owner");
        require(coupons[tokenId].redeemed == false, "Already Redeemed");

        coupons[tokenId].redeemed = true;
        coupons[tokenId].redeemedTimeStamp = now;

        emit redeemCouponEvent(msg.sender, tokenId, tokenURI(tokenId), now);
    }

    function getMyCoupons() public view returns (CouponItem[] memory) {
        CouponItem [] memory myCoupons = new CouponItem[](balanceOf(msg.sender));
        uint256 tokenId;

        if (balanceOf(msg.sender) > 0) {
            uint j = 0;
            for (uint i = 0; i < totalSupply(); i++) {
                tokenId = tokenByIndex(i);
                if (ownerOf(tokenId) == msg.sender) {
                    myCoupons[j] = coupons[tokenId];
                    j++;
                }
            }
        }

        return myCoupons;
    }
}