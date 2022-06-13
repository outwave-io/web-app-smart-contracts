// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/*
 * @title OEMixinCore
 * @author Miro Radenovic (miro@demind.io)
 * @dev The Core of the Outwave Event provides access to common properties (fields) accessed by other mixins. Child mixins can access
 * to internal fields, only with proper get and set function, marked as internals. Direct access to fields is forbidden
 */
contract EventCoreMixin {
    struct OrganizationData {
        address organizationAddress; // todo: is this needed? We have the address in the _userOrganizations mapping key
        mapping(address => Lock) locksEntity; // fast searching
        Lock[] locks; //fast returnig of all locks
        bool exists;
    }

    struct Lock {
        bytes32 eventId;    
        address lockAddr;
        bool exists;
    }

    // EVENTS

    event EventCreated(
         address indexed owner,
         bytes32 eventId
    );

    event EventDisabled(
         address indexed owner,
         bytes32 eventId
    );

    event LockRegistered(
        address indexed owner,
        bytes32 indexed eventId,
        address indexed lockAddress,
        address outwaveEventAddress,
        bytes32 lockId
    );
    event LockUpdated(
        address indexed lockAddress
    );

    event LockDeregistered(
        address indexed owner,
        bytes32 indexed eventId,
        address indexed lockAddress
    );



    //todo: waht is those become huge? do we even care?
    mapping(address => OrganizationData) private _userOrganizations;
    mapping(bytes32 => address) private _eventIds;

    // list of the tokens that can be used for key purchases in locks
    mapping(address => bool) internal  _allowedErc20Tokens;


    address internal _unlockAddr;
    bool internal _allowLockCreation;
    address payable internal _outwavePaymentAddress;

    modifier lockAreEnabled() {
        require(_allowLockCreation, "CREATE_LOCKS_DISABLED");
        _;
    }

    modifier onlyLockOwner(address lock) {
        // require(_userOrganizations[msg.sender].exists, "ORGANIZATION_REQUIRED");
        require(_isUserLockOwner(msg.sender, lock), "USER_NOT_OWNER"); //fast and 0 gas checks
        _;
    }

    modifier onlyEventOwner(bytes32 eventId) {
        // require(_userOrganizations[msg.sender].exists, "ORGANIZATION_REQUIRED");
        require(_eventIds[eventId] == msg.sender, "USER_NOT_OWNER"); //fast and 0 gas checks
        _;
    }

    modifier tokenAddressIsAvailable(address tokenAddress) {
        require(_allowedErc20Tokens[tokenAddress], "ERC20_NOT_AVAILABLE"); 
        _;
    }

    function _isUserLockOwner(address user, address lock)
        internal
        view
        returns (bool)
    {
        return (_userOrganizations[user].locksEntity[lock].exists);
    }

    // function onlyLockEntityOwner2(Lock memory lock) {
    //   // require(_userOrganizations[msg.sender].exists, "ORGANIZATION_REQUIRED");
    //   require(_userOrganizations[msg.sender].locksEntity[lock.lockAddr].exists, "USER_NOT_OWNER");  //fast and 0 gas checks
    //   _;
    // }

    function _initializeOEMixinCore(
        address unlockaddr,
        address payable paymentAddr
    ) internal {
        _unlockAddr = unlockaddr;
        _outwavePaymentAddress = paymentAddr;
        _allowLockCreation = true;
        _allowedErc20Tokens[address(0)] = true;  // allow creation of lock with payment in native token
    }

    /* manages organization lock collection */

    function _registerNewOrganization(
        address ownerAddress,
        address entityAddress
    ) internal {
        if (_userOrganizations[ownerAddress].exists) revert();
        _userOrganizations[ownerAddress].exists = true;
        _userOrganizations[ownerAddress].organizationAddress = entityAddress;
    }

    function _isOrganizationAddressEntity(address ownerAddress)
        internal
        view
        returns (bool isIndeed)
    {
        return _userOrganizations[ownerAddress].exists;
    }

    function _isLockAddressEntity(address ownerAddress, address entityAddress)
        internal
        view
        returns (bool isIndeed)
    {
        return
            _userOrganizations[ownerAddress].locksEntity[entityAddress].exists;
    }

    function _eventLockRegister(
        address ownerAddress,
        bytes32 eventId,
        address entityAdresses,
        bytes32 lockId
    ) internal {
        if (_isLockAddressEntity(ownerAddress, entityAdresses))
            revert("CORE_LOCK_ADDRESS_EXISTS");
        Lock memory newLock = Lock({
            eventId: eventId,
            exists: true,
            lockAddr: entityAdresses
        });
        _userOrganizations[ownerAddress].locks.push(newLock);
        _userOrganizations[ownerAddress].locksEntity[
            entityAdresses
        ] = newLock;
        _eventIds[eventId] = msg.sender;
        emit LockRegistered(
            ownerAddress,
            eventId,
            entityAdresses,
            address(this),
            lockId
        );
    }

    function _eventLockDeregister(
        address ownerAddress,
        bytes32 eventId,
        address entityAddress
    ) internal {
        require( _isLockAddressEntity(ownerAddress, entityAddress), "CORE_USER_NOT_OWNER");
        require(eventExists(eventId), "CORE_EVENTID_INVALID");
        _userOrganizations[ownerAddress]
            .locksEntity[entityAddress]
            .exists = false;
        for (uint i = 0; i < _userOrganizations[ownerAddress].locks.length;i++) {
            if (_userOrganizations[ownerAddress].locks[i].lockAddr == entityAddress) {
                _userOrganizations[ownerAddress].locks[i].exists = false;
                _eventIds[eventId] = address(0);
                emit LockDeregistered(
                    ownerAddress,
                    _userOrganizations[ownerAddress].locks[i].eventId,
                    _userOrganizations[ownerAddress].locks[i].lockAddr
                );
                break;
            }
        }
    }

    function _eventLocks(bytes32 eventId, address owner)
        internal
        view
        returns (Lock[] memory)
    {
        Lock[] memory locks = _userOrganizations[owner].locks;
        //WTF https://stackoverflow.com/questions/68010434/why-cant-i-return-dynamic-array-in-solidity
        uint count;
        for (uint i = 0; i < locks.length; i++) {
            if (locks[i].eventId == eventId) {
                count++;
            }
        }
        uint returnIndex;
        Lock[] memory result = new Lock[](count);
        for (uint i = 0; i < locks.length; i++) {
            if (locks[i].eventId == eventId) {
                result[returnIndex] = locks[i];
                returnIndex;
            }
        }
        return result;
    }

    function _erc20PaymentTokenAdd (address erc20addr) internal{
        _allowedErc20Tokens[erc20addr] = true;
    }

    function _erc20PaymentTokenRemove (address erc20addr) internal{
        _allowedErc20Tokens[erc20addr] = false;
    }

    function _erc20PaymentTokenIsAllowed (address erc20addr) internal view returns (bool) {
        return _allowedErc20Tokens[erc20addr];
    }

    function eventExists(bytes32 eventId) public view returns (bool) {
        return (_eventIds[eventId] != address(0));
    }

    /* public */

    function eventLocksGetAll() public view returns (Lock[] memory) {
        return _userOrganizations[msg.sender].locks;
    }

    function eventLocksGetAll(bytes32 eventId)
        public
        view
        returns (Lock[] memory)
    {
        return _eventLocks(eventId, msg.sender);
    }

    function eventLocksGetAll(bytes32 eventId, address owner)
        public
        view
        returns (Lock[] memory)
    {
        return _eventLocks(eventId, owner);
    }

    function eventByLock(address lockAddress, address ownerAddress)
        external
        view
        returns (bytes32 eventId)
    {
        Lock memory lock = _userOrganizations[ownerAddress].locksEntity[lockAddress];
        if (lock.exists) return lock.eventId;
        return 0;
    }

    function eventOwner(bytes32 eventId)
        external
        view
        returns (address owner) 
    {
        return _eventIds[eventId];
    }
}
