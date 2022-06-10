// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";
import "@unlock-protocol/contracts/dist/PublicLock/ILockKeyPurchaseHookV7.sol";

import "./OEMixinCore.sol";
import "hardhat/console.sol";

/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract OEMixinFeePurchaseHook is OEMixinCore, ILockKeyPurchaseHookV7 {
    event OutwavePaymentTransfered(address from, uint amount);

    /**
     * @notice Used to determine the purchase price before issueing a transaction.
     * This allows the hook to offer a discount on purchases.
     * This may revert to prevent a purchase.
     * @param from the msg.sender making the purchase
     * @param recipient the account which will be granted a key
     * @param referrer the account which referred this key sale
     * @param data arbitrary data populated by the front-end which initiated the sale
     * @return minKeyPrice the minimum value/price required to purchase a key with these settings
     * @dev the lock's address is the `msg.sender` when this function is called via
     * the lock's `purchasePriceFor` function
     */
    function keyPurchasePrice(
        address from,
        address recipient,
        address referrer,
        bytes calldata data
    ) external view override returns (uint minKeyPrice) {
        uint price =  IPublicLockV10(msg.sender).keyPrice();
        console.log("keyPurchasePrice is ",price);
        return price;
    }

    /**
     * @notice If the lock owner has registered an implementer then this hook
     * is called with every key sold.
     * @param from the msg.sender making the purchase
     * @param recipient the account which will be granted a key
     * @param referrer the account which referred this key sale
     * @param data arbitrary data populated by the front-end which initiated the sale
     * @param minKeyPrice the price including any discount granted from calling this
     * hook's `keyPurchasePrice` function
     * @param pricePaid the value/pricePaid included with the purchase transaction
     * @dev the lock's address is the `msg.sender` when this function is called
     */
    function onKeyPurchase(
        address from,
        address recipient,
        address referrer,
        bytes calldata data,
        uint minKeyPrice,
        uint pricePaid
    ) external override {
        
    }

    function onKeyPurchased(
        uint pricePaid
    ) external override{
        IPublicLockV10 lock = IPublicLockV10(msg.sender);
        uint fee = pricePaid - ((98 * pricePaid) / 100);
        address tokenadd = lock.tokenAddress();
        lock.withdraw(tokenadd, fee);
        if(tokenadd != address(0)){
            IERC20 erc20 = IERC20(tokenadd);
            erc20.transfer(_outwavePaymentAddress, fee);
        }
        else{
            _outwavePaymentAddress.transfer(address(this).balance);
        }
        emit OutwavePaymentTransfered(msg.sender, fee);
    }
}
