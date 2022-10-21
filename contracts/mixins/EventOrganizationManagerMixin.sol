// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import {IUnlockV11 as IUnlock} from "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";

import "./EventTransferableMixin.sol";
import "../interfaces/IEventOrganizationManagerMixin.sol";
import "../interfaces/IEventTransferable.sol";
import "hardhat/console.sol";

/**
    @author Miro Radenovic | Demind.io
    @title Provides API's to organizations that creats events
 */
contract EventOrganizationManagerMixin is EventTransferableMixin, IEventOrganizationManagerMixin {
    /* unlock */

    function _getMaxInt() private pure returns (uint256) {
        return 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    }

    /**
        @notice Creates an unlock's public lock, registering current contract in the hooks. 
        @dev OEMixinFeePurchaseHook implements the hooks
     */
    function _createLock(
        address tokenAddress,
        uint256 keyPrice,
        uint256 maxNumberOfKeys,
        uint256 maxKeysPerAddress,
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
            _getMaxInt(),
            tokenAddress,
            keyPrice,
            maxNumberOfKeys,
            lockName
        );

        address newlocladd = IUnlock(_unlockAddr).createUpgradeableLock(data);
        IPublicLock lock = IPublicLock(newlocladd);
        lock.setOwner(msg.sender);
        lock.setEventHooks(address(this), address(0), address(0), address(this));
        lock.setMaxKeysPerAddress(maxKeysPerAddress);
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
        uint256 maxKeysPerAddress,
        bytes32 lockId
    ) private lockAreEnabled returns (address) {
        address result = _createLock(tokenAddress, keyprice, numberOfKey, maxKeysPerAddress, name);
        _eventLockRegister(msg.sender, eventId, result, lockId);
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
        @param maxKeysPerAddress the max number of NFT that can be purchased
        @param lockId id created from the outwave app to allow reconciliations,
        this is only emitted with events and not persisted in the contract        
     */
    function eventCreate(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        uint256 maxKeysPerAddress,
        bytes32 lockId
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
            maxKeysPerAddress,
            lockId
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
     */
    function addLockToEvent(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        uint256 maxKeysPerAddress,
        bytes32 lockId
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
                maxKeysPerAddress,
                lockId
            );
    }

    /**
        @notice Disable and event and all related locks. 
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
     */
    function eventDisable(
        bytes32 eventId
    ) public override onlyEventOwner(eventId) {
        Lock[] memory userLocks = eventLocksGetAll(eventId);
        for (uint256 i = 0; i < userLocks.length; i++) {
            if (userLocks[i].exists) {
                // //eventLockDisable(userLocks[i].lockAddr);
                // require(
                //     _isUserLockOwner(msg.sender, userLocks[i].lockAddr),
                //     "USER_NOT_OWNER"
                // );
                IPublicLock lock = IPublicLock(userLocks[i].lockAddress);
                lock.setMaxNumberOfKeys(lock.totalSupply());
                _eventLockDeregister(
                    msg.sender,
                    eventId,
                    userLocks[i].lockAddress
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
            IERC20Upgradeable erc20 = IERC20Upgradeable(tokenadd);
            bool success = erc20.transfer(msg.sender, amount);
            require(success, "WITHDRAW_FROM_LOCK_FAILED");
        } else {
            payable(msg.sender).transfer(amount);
        }
    }

    /**
        @notice Grant NFTs of specific lock with maximum expiration. Check unlock's Public Lock 
        documentation  for more info
        @param lockAddress the address of the lock 
        @param recipients the recipients
     */
    function eventGrantKeys(
        address lockAddress,
        address[] calldata recipients
    ) public override onlyLockOwner(lockAddress) lockAreEnabled {
        uint256[] memory expirationTimestamps = new uint256[](
            recipients.length
        );
        for (uint256 i = 0; i < recipients.length; i++) {
            expirationTimestamps[i] = _getMaxInt();
        }
        address[] memory addressArray = new address[](recipients.length);
        IPublicLock(lockAddress).grantKeys(
            recipients,
            expirationTimestamps,
            addressArray
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
        uint256 maxNumberOfKeys,
        uint256 maxKeysPerAddress
    ) public override onlyLockOwner(lockAddress) {
        IPublicLock lock = IPublicLock(lockAddress);
        lock.updateLockName(lockName);
        lock.updateKeyPricing(keyPrice, lock.tokenAddress());
        lock.setMaxNumberOfKeys(maxNumberOfKeys);
        lock.setMaxKeysPerAddress(maxKeysPerAddress);
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
        @notice upgrades and event to a new event manager
        @param eventId the id of the event 
        @param newEventApiAddress the new address of the event manager. Only authorized address can be used
        @dev this will basically transfert the struct containing the mapping of user and events, and reassign 
            locks managers to new event manager


    - Caso d’uso: upgrade delle api per la gesatione di un publiclock.Un utente deve poter chiamare upgradeLockApi(addressLock, newApiAddress)
        per poter avere accesso alle nuove api. Questo implica però che deve essere fatto su un evento (upgradeEventApi(eventId, new lockaddress)), che 
    - Trasferisce l’ownership ad un altro apiAddress
    - Sposta la collezione di struct per registrare. Questo indica che deve poter essere chiamata anche da fuori da uno o
         più indirizzi registrati.
    - Per ogni eventmanager deve poter essere possibile  inserire una listache indirizzi che permettano alcune operazioni di registrazione e deregistrazione. Solo l’owner del contratto può essere colui che registra questi indirizzi

     */
    function eventUpgradeApi(
         bytes32 eventId,
         address newEventApiAddress
    ) public override onlyEventOwner(eventId) {
        require(upgradableEventManagersIsAllowed(newEventApiAddress), "UNAUTHORIZED_DESTINATION_ADDRESS");
        IEventTransferable eventTransfert = IEventTransferable(newEventApiAddress);
        Lock[] memory userLocks = eventLocksGetAll(eventId);
        for (uint256 index = 0; index < userLocks.length; index++) {
            _eventLockDeregister(msg.sender,eventId,userLocks[index].lockAddress);
            eventTransfert.eventLockRegister(msg.sender, eventId, userLocks[index].lockAddress, userLocks[index].lockId);
            IPublicLock lock = IPublicLock(userLocks[index].lockAddress);
            lock.addLockManager(newEventApiAddress);
            lock.renounceLockManager();
                // todo: shuold we emit?
        }    
    }

    /**
        @notice changes the owner of an organization
        @param newOwnerAddress the new owner address
     */
    function organizationChangeOwner(
        address newOwnerAddress
    ) external override {
        require(_organizationIsOwned(msg.sender), "UNAUTHORIZED_SENDER_NOT_OWNER");
        require(!_organizationIsOwned(newOwnerAddress), "UNAUTHORIZED_ALREADY_OWNED");

        _organizationChangeOwner(msg.sender, newOwnerAddress);

        emit OrganizationOwnerChanged(msg.sender, newOwnerAddress);
    }

    /**
        @notice checks if an address own an organization
        @param ownerAddress the address to check
     */
    function organizationIsOwned(
        address ownerAddress
    ) external override view returns(bool)
    {
        return _organizationIsOwned(ownerAddress);
    }
}
