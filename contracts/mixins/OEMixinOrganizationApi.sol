// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    uint256 MAX_INT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;

    function _createLock(
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
            MAX_INT,
            tokenAddress,
            keyPrice,
            maxNumberOfKeys,
            lockName
        );

        address newlocladd = IUnlock(_unlockAddr).createUpgradeableLock(data);
        IPublicLock lock = IPublicLock(newlocladd);
        lock.setEventHooks(
            address(this),
            address(0),
            address(0),
            address(0)
        );
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

    function _eventLockCreate(
        bytes32 eventId,
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri
    ) public lockAreEnabled returns (address) {

        address result = _createLock(
            tokenAddress,
            keyprice,
            numberOfKey,
            name
        );
        IPublicLock(result).setBaseTokenURI(baseTokenUri);
        _eventLockRegister(msg.sender, eventId, result);
        return result;
    }

    function eventCreate(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri
    ) public lockAreEnabled tokenAddressIsAvailable(tokenAddress) returns (address) {
        require(!eventExists(eventId), "EVENT_ID_ALREADY_EXISTS");
        address result = _eventLockCreate(
                eventId,
                name,
                tokenAddress,
                keyprice,
                numberOfKey,
                baseTokenUri
            );
        emit EventCreated(msg.sender, eventId);
        return result;
    }

    /**
    * Adds a lock to the event, verifying the msg.sender is actually the owner of the event
    */
    function addLockToEvent(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri
    ) external onlyEventOwner(eventId) tokenAddressIsAvailable(tokenAddress) lockAreEnabled returns (address) {
        return
            _eventLockCreate(
                eventId,
                name,
                tokenAddress,
                keyprice,
                numberOfKey,
                baseTokenUri
            );
    }

    /* locks */

    /**
    * The ability to disable locks has been removed on v10 to decrease contract code size.
    * Disabling locks can be achieved by setting `setMaxNumberOfKeys` to `totalSupply`
    * and expire all existing keys.
    * @dev the variables are kept to prevent conflicts in storage layout during upgrades
    * TODO: do need to expire the keys?
    */
    function eventDisable(bytes32 eventId) public {
        Lock[] memory userLocks = eventLocksGetAll(eventId);
        for (uint256 i = 0; i < userLocks.length; i++) {
            if (userLocks[i].exists) {
                //eventLockDisable(userLocks[i].lockAddr);
                require(
                    _isUserLockOwner(msg.sender, userLocks[i].lockAddr),
                    "USER_NOT_OWNER"
                );
                IPublicLock lock = IPublicLock(userLocks[i].lockAddr);
                lock.setMaxNumberOfKeys(lock.totalSupply());
                _eventLockDeregister(
                    msg.sender,
                    eventId,
                    userLocks[i].lockAddr
                );
            }
        }
        emit EventDisabled(msg.sender, eventId);
    }

    function eventLockDisable(bytes32 eventId, address lockAddress)
        public
        onlyLockOwner(lockAddress)
    {
        IPublicLock lock = IPublicLock(lockAddress);
        lock.setMaxNumberOfKeys(lock.totalSupply());
        _eventLockDeregister(msg.sender, eventId, lockAddress);
    }

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

    function withdraw(
        address lockAddress,
        uint amount
    ) external onlyLockOwner(lockAddress) {
        IPublicLock lock = IPublicLock(lockAddress);
        address tokenadd = lock.tokenAddress();
        lock.withdraw(tokenadd,amount);
        if(tokenadd != address(0)){
            //todo: shall we use safeerc20upgradable?
            IERC20 erc20 = IERC20(tokenadd);
            erc20.transfer(msg.sender, amount);
        }
        else{
            payable(msg.sender).transfer(amount);
        }


    }

    //todo.. do we care?
    function  eventLockUpdateLockSymbol(
        address lockAddress,
        string calldata lockSymbol
    ) external onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).updateLockSymbol(lockSymbol);
    }

    function eventLockSetBaseTokenURI(
        address lockAddress,
        string calldata baseTokenURI
    ) external onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).setBaseTokenURI(baseTokenURI);
    }


    function eventLockUpdate(
        address lockAddress,
        string calldata lockName,
        uint256 keyPrice, // the price of each key (nft)
        uint256 maxNumberOfKeys
    ) external onlyLockOwner(lockAddress) {
        IPublicLock lock = IPublicLock(lockAddress);
        lock.updateLockName(lockName);
        lock.updateKeyPricing(keyPrice, lock.tokenAddress()); //todo: use stable
        lock.setMaxNumberOfKeys(maxNumberOfKeys);
        
        emit LockUpdated(lockAddress);
    }
}
