// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";

import {IUnlockV11 as IUnlock} from "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";

// todo: ma che cazzo è sta roba...? sembra un bug di hardhat quando compila
//import "../_unlock/PublicLockV10.sol";
//import "../_unlock/UnlockV11.sol";

import "../OutwaveOrganization.sol";
import "./OEMixinCore.sol";
import "hardhat/console.sol";

/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract OEMixinOrganizationApi is OEMixinCore {
    /* unlock */

    function _createLock(
        uint256 expirationDuration,
        address tokenAddress,
        uint256 keyPrice,
        uint256 maxNumberOfKeys,
        string memory lockName
    )
        private
        // bytes12 // _salt
        lockAreEnabled
        returns (address)
    {
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,uint256,address,uint256,uint256,string)",
            address(this),
            expirationDuration,
            tokenAddress,
            keyPrice,
            maxNumberOfKeys,
            lockName
        );

        address newlocladd = IUnlock(_unlockAddr).createUpgradeableLock(data);
        IPublicLock(newlocladd).setEventHooks(
            address(this),
            address(0),
            address(0),
            address(0)
        );
        console.log("new public lock address", newlocladd);
        return newlocladd;
    }

    // /**
    //    * @notice Updates locks owner to new OutWave Event contract to gain new api.
    //    * @param lockAddr address of the lock to update
    //    * @param newOutWaveEventAddr address of the new Outwave Event
    //    */
    // function updateLocksApi(
    //   address lockAddr,
    //   address newOutWaveEventAddr
    // ) public{
    //   //todo
    // }

    function eventCreate(
        uint256 eventId, //todo: review this
        string[] memory names,
        uint256[] memory keyprices,
        uint256[] memory numberOfKeys,
        uint8[] memory royalties,
        string[] memory baseTokenUris
    ) public lockAreEnabled returns (address[] memory) {
        console.log("event create called ");
        require(
            (names.length == keyprices.length) &&
                (keyprices.length == numberOfKeys.length) &&
                (numberOfKeys.length == royalties.length) &&
                (royalties.length == baseTokenUris.length),
            "PARAMS_NOT_VALID"
        );

        address[] memory result = new address[](numberOfKeys.length);
        for (uint256 i; i < keyprices.length; i++) {
            address newAddr = _createLock(
                0,
                address(0),
                keyprices[i],
                numberOfKeys[i],
                names[i]
            );
            result[i] = newAddr;
            IPublicLock(newAddr).setBaseTokenURI(baseTokenUris[i]);
        }
        _eventLockRegister(msg.sender, eventId, result, royalties);
        return result;
    }

    /* locks */

    // rmeoved in v10... find a different way
    // function disableLock(
    //   address lockAddress
    // )  external onlyLockOwner(lockAddress)  {
    //   _deregisterLock(msg.sender, lockAddress);
    //    IPublicLock(lockAddress).disableLock();
    // }

    function eventGrantKeys(
        address lockAddress,
        address[] calldata recipients,
        uint256[] calldata expirationTimestamps,
        address[] calldata keyManagers
    ) external onlyLockOwner(lockAddress) lockAreEnabled {
        IPublicLock(lockAddress).grantKeys(
            recipients,
            expirationTimestamps,
            keyManagers
        );
    }

    // function eventWithdraw(
    //   address lockAddress
    // ) external onlyLockOwner(lockAddress) {
    //     uint lockaddressBalance = lockAddress.balance;
    //     require(lockaddressBalance > 0, "LOCK_NO_FUNDS");
    //     IPublicLock(lockAddress).withdraw(address(0), lockAddress.balance);
    //     payable(msg.sender).transfer(lockaddressBalance);
    // }

    function eventWithdraw(uint256 eventId) external {
        // uint lockaddressBalance = lockAddress.balance;
        // require(lockaddressBalance > 0, "LOCK_NO_FUNDS");
        // IPublicLock(lockAddress).withdraw(address(0), lockAddress.balance);
        // payable(msg.sender).transfer(lockaddressBalance);
    }

    function eventUpdateKeyPricing(address lockAddress, uint256 keyPrice)
        external
        onlyLockOwner(lockAddress)
    {
        IPublicLock(lockAddress).updateKeyPricing(keyPrice, address(0));
    }

    function eventSetMaxNumberOfKeys(
        address lockAddress,
        uint256 maxNumberOfKeys
    ) external onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).setMaxKeysPerAddress(maxNumberOfKeys);
    }

    //todo.. do we care?
    function eventUpdateLockSymbol(
        address lockAddress,
        string calldata lockSymbol
    ) external onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).updateLockSymbol(lockSymbol);
    }

    function eventSetBaseTokenURI(
        address lockAddress,
        string calldata baseTokenURI
    ) external onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).setBaseTokenURI(baseTokenURI);
    }
}
