// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IUnlockV11 as IUnlock} from "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";

import "./EventCoreMixin.sol";
import "../interfaces/IEventOrganizationManagerMixin.sol";
import "hardhat/console.sol";

/**
    @author Miro Radenovic | Demind.io
    @title Provides API's to organizations that creats events
 */
contract EventOrganizationManagerMixin is EventCoreMixin, IEventOrganizationManagerMixin {
    /* unlock */

    uint256 MAX_INT =
        115792089237316195423570985008687907853269984665640564039457584007913129639935;

    /**
        @notice Creates an unlock's public lock, registering current contract in the hooks. 
        @dev OEMixinFeePurchaseHook implements the hooks
     */
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
        lock.setEventHooks(address(this), address(0), address(0), address(0));
        return newlocladd;
    }

    /**
        @notice Creates a new event with a single public lock. 
        @dev User's Locks are registered the hooks.
     */
    function _eventLockCreate(
        bytes32 eventId,
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri
    ) private lockAreEnabled returns (address) {
        address result = _createLock(tokenAddress, keyprice, numberOfKey, name);
        IPublicLock(result).setBaseTokenURI(baseTokenUri);
        _eventLockRegister(msg.sender, eventId, result);
        return result;
    }

    /**
        @notice Public method to create events. Creating an event, a public lock is created.
        to add additional public locks, use addLockToEvent
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
        @param name the name of the public lock
        @param tokenAddress the address of the ERC20 token that want's to be used, or pass adress(0) to use native token.
        Allowed ERC20 are defined from the owner of the contract by setting erc20PaymentTokenAdd in OEMixinManage.
        @param keyprice the price of each NFT (public lock key). this can be updated later
        @param numberOfKey the max number of NFT that can be generated. this can be updated later
        @param baseTokenUri the tokenuri
     */
    function eventCreate(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri
    )
        public override
        lockAreEnabled
        tokenAddressIsAvailable(tokenAddress)
        returns (address)
    {
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
        @notice Public method to create and add a public lock to a specific event. 
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
        @param name the name of the public lock
        @param tokenAddress the address of the ERC20 token that want's to be used, or pass adress(0) to use native token.
        Allowed ERC20 are defined from the owner of the contract by setting erc20PaymentTokenAdd in OEMixinManage.
        @param keyprice the price of each NFT (public lock key). this can be updated later
        @param numberOfKey the max number of NFT that can be generated. this can be updated later
        @param baseTokenUri the tokenuri
     */
    function addLockToEvent(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri
    )
        public override
        onlyEventOwner(eventId)
        tokenAddressIsAvailable(tokenAddress)
        lockAreEnabled
        returns (address)
    {
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

    /**
        @notice Disable and event and all related locks. 
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
     */
    function eventDisable(
        bytes32 eventId
    ) public override {
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

    /**
        @notice Disable a specific lock. 
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
        @param lockAddress the address of the lock to disable
     */
    function eventLockDisable(
        bytes32 eventId, 
        address lockAddress
    ) public override onlyLockOwner(lockAddress)
    {
        IPublicLock lock = IPublicLock(lockAddress);
        lock.setMaxNumberOfKeys(lock.totalSupply());
        _eventLockDeregister(msg.sender, eventId, lockAddress);
    }

    /**
     *  @notice withdraw from a specifc lock. Only owners can perform this action
        @param lockAddress the address of the lock 
        @param amount the amount to withdraw
     */
    function withdraw(
        address lockAddress, 
        uint256 amount
    ) public override onlyLockOwner(lockAddress)
    {
        IPublicLock lock = IPublicLock(lockAddress);
        address tokenadd = lock.tokenAddress();
        lock.withdraw(tokenadd, amount);
        if (tokenadd != address(0)) {
            //todo: shall we use safeerc20upgradable?
            IERC20 erc20 = IERC20(tokenadd);
            erc20.transfer(msg.sender, amount);
        } else {
            payable(msg.sender).transfer(amount);
        }
    }

    /**
        @notice Grant NFTs of specific lock with maximum expiration. Check unlock's Public Lock 
        documentation  for more info
        @param lockAddress the address of the lock 
        @param recipients the recipients
        @param keyManagers the address of the lock 
     */
    function eventGrantKeys(
        address lockAddress,
        address[] calldata recipients,
        address[] calldata keyManagers
    ) public override onlyLockOwner(lockAddress) lockAreEnabled {
        uint256[] memory expirationTimestamps = new uint256[](
            recipients.length
        );
        for (uint256 i = 0; i < recipients.length - 1; i++) {
            expirationTimestamps[i] = MAX_INT;
        }
        IPublicLock(lockAddress).grantKeys(
            recipients,
            expirationTimestamps,
            keyManagers
        );
    }

    /**
        @notice Updates locks params. Check unlock's Public Lock documentation for more info
        @param lockAddress the address of the lock 
        @param lockName the name of the lock
        @param keyPrice the price of each nft
        @param maxNumberOfKeys max number of nft that can be created
     */
    function eventLockUpdate(
        address lockAddress,
        string calldata lockName,
        uint256 keyPrice, // the price of each key (nft)
        uint256 maxNumberOfKeys
    ) public override onlyLockOwner(lockAddress) {
        IPublicLock lock = IPublicLock(lockAddress);
        lock.updateLockName(lockName);
        lock.updateKeyPricing(keyPrice, lock.tokenAddress());
        lock.setMaxNumberOfKeys(maxNumberOfKeys);
        emit LockUpdated(lockAddress);
    }

    /**
        @notice change the lock locks symbol. Check unlock's Public Lock documentation for more info
        @param lockAddress the address of the lock 
        @param lockSymbol the uri symbol
     */
    function eventLockUpdateLockSymbol(
        address lockAddress,
        string calldata lockSymbol
    ) public override onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).updateLockSymbol(lockSymbol);
    }

    /**
        @notice change the lock locks symbol. Check unlock's Public Lock documentation for more info
        @param lockAddress the address of the lock 
        @param baseTokenURI the base token uri
     */
    function eventLockSetBaseTokenURI(
        address lockAddress,
        string calldata baseTokenURI
    ) public override onlyLockOwner(lockAddress) {
        IPublicLock(lockAddress).setBaseTokenURI(baseTokenURI);
    }
}
