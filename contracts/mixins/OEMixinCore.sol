// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @title OEMixinCore
 * @author Miro Radenovic (miro@demind.io)
 * The Core of the Outwave Event provides access to common properties (fields) accessed by other mixins
 */
contract OEMixinCore {
    struct OrganizationData {
        address organizationAddress; // todo: is this needed? We have the address in the _userOrganizations mapping key
        mapping(address => Lock) locksEntity; // fast searching
        Lock[] locks; //fast returnig of all locks
        bool exists;
    }

    struct Lock {
        bytes32 eventId;
        address lockAddr;
        uint8 royalty;
        bool exists;
    }

    event LockRegistered(
        address indexed owner,
        bytes32 indexed eventId,
        address indexed lockAddress,
        address outwaveEventAddress
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
    mapping(bytes32 => bool) private _eventIds;
    address[] private _users;

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
    }

    /* manages organization lock collection */

    function _registerNewOrganization(
        address ownerAddress,
        address entityAddress
    ) internal {
        if (_userOrganizations[ownerAddress].exists) revert();
        _userOrganizations[ownerAddress].exists = true;
        _userOrganizations[ownerAddress].organizationAddress = entityAddress;
        _users.push(ownerAddress);
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
        uint8 royalies
    ) internal {
            if (_isLockAddressEntity(ownerAddress, entityAdresses))
                revert("CORE_LOCK_ADDRESS_EXISTS");
            Lock memory newLock = Lock({
                eventId: eventId,
                royalty: royalies,
                exists: true,
                lockAddr: entityAdresses
            });
            _userOrganizations[ownerAddress].locks.push(newLock);
            _userOrganizations[ownerAddress].locksEntity[
                entityAdresses
            ] = newLock;
            _eventIds[eventId] = true;
            emit LockRegistered(
                ownerAddress,
                eventId,
                entityAdresses,
                address(this)
            );
    }

    function _eventLockDeregister(
        address ownerAddress,
        bytes32 eventId,
        address entityAddress
    ) internal {
        require(
            _isLockAddressEntity(ownerAddress, entityAddress),
            "CORE_USER_NOT_OWNER"
        );
        require(eventExists(eventId), "CORE_EVENTID_INVALID");
        _userOrganizations[ownerAddress]
            .locksEntity[entityAddress]
            .exists = false;
        for (
            uint i = 0;
            i < _userOrganizations[ownerAddress].locks.length;
            i++
        ) {
            if (
                _userOrganizations[ownerAddress].locks[i].lockAddr ==
                entityAddress
            ) {
                _userOrganizations[ownerAddress].locks[i].exists = false;
                _eventIds[eventId] = false;
                emit LockDeregistered(
                    ownerAddress,
                    _userOrganizations[ownerAddress].locks[i].eventId,
                    _userOrganizations[ownerAddress].locks[i].lockAddr
                );
                break;
            }
        }
    }

    function eventExists(bytes32 eventId) public view returns (bool) {
        return _eventIds[eventId] == true;
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

    // note that this is broken: users are appended only in _registerNewOrganization,
    // but now locks can be registered in other methods without an org.
    function getEventByLock(address lockAddress)
        external
        view
        returns (bytes32 eventId)
    {
        for (uint i = 0; i < _users.length; i++) {
            address ownerAddress = _users[i];
            Lock memory eventLock = _userOrganizations[ownerAddress]
                .locksEntity[lockAddress];
            if (eventLock.exists) return eventLock.eventId;
        }
        return 0;
    }
}
