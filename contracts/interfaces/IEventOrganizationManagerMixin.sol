// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.17 <0.9.0;

interface IEventOrganizationManagerMixin {

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
        @param lockId id created from the outwave app to allow reconciliations,
        this is only emitted with events and not persisted in the contract
    @param baseTokenUri the tokenuri
    */
    function eventCreate(
        bytes32 eventId, 
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri,
        bytes32 lockId
    ) external returns (address);

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
        @param lockId id created from the outwave app to allow reconciliations,
        this is only emitted with events and not persisted in the contract
    */
    function addLockToEvent(
        bytes32 eventId, //todo: review this
        string memory name,
        address tokenAddress,
        uint256 keyprice,
        uint256 numberOfKey,
        string memory baseTokenUri,
        bytes32 lockId
    ) external returns (address);


    /**
        @notice Disable and event and all related locks. 
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
     */
    function eventDisable(
        bytes32 eventId
    ) external;

     /**
        @notice Disable a specific lock. 
        @param eventId id created from the outwave app to allow reconciliations. Locks that do not have a
        corresponding eventId in the application's database, are ignored
        @param lockAddress the address of the lock to disable
     */
    function eventLockDisable(
        bytes32 eventId, 
        address lockAddress
    ) external;

    /**
     *  @notice withdraw from a specifc lock. Only owners can perform this action
        @param lockAddress the address of the lock 
        @param amount the amount to withdraw
     */
    function withdraw(
        address lockAddress, 
        uint256 amount
    ) external;

    /**
        @notice Grant NFTs of specific lock with maximum expiration. Check unlock's Public Lock 
        documentation  for more info
        @param lockAddress the address of the lock 
        @param recipients the recipients
     */
    function eventGrantKeys(
        address lockAddress,
        address[] calldata recipients
    ) external;

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
    ) external;

     /**
        @notice change the lock locks symbol. Check unlock's Public Lock documentation for more info
        @param lockAddress the address of the lock 
        @param lockSymbol the uri symbol
     */
    function eventLockUpdateLockSymbol(
        address lockAddress,
        string calldata lockSymbol
    ) external;

    /**
        @notice change the lock locks symbol. Check unlock's Public Lock documentation for more info
        @param lockAddress the address of the lock 
        @param baseTokenURI the base token uri
     */
    function eventLockSetBaseTokenURI(
        address lockAddress,
        string calldata baseTokenURI
    ) external;

    /**
        @notice change the max keys per address (default 1). Check unlock's Public Lock documentation for more info
        @param lockAddress the address of the lock 
        @param maxKeysPerAddress the max keys per address
     */
    function eventLockSetMaxKeysPerAddress(
        address lockAddress,
        uint256 maxKeysPerAddress
    ) external;

    // /**
    //     @notice upgrades and event to a new event manager
    //     @param eventId the id of the event 
    //     @param newEventApiAddress the new address of the event manager. Only authorized address can be used
    //  */
    // function eventUpgradeApi(
    //      bytes32 eventId,
    //      address newEventApiAddress
    // ) external;
}
