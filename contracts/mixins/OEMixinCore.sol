
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

  struct OrganizationData{
    address organizationAddress;
    mapping(address => Lock) locksEntity;  // fast searching
    Lock[] locks; //fast returnig of all locks
    bool exists;
  }

  struct Lock{
    bytes32  eventId;
    address lockAddr;
    uint8 royalty;
    bool exists;
  }

  event LockRegistered(address indexed owner, bytes32 indexed eventId, address indexed lockAddress, address outwaveEventAddress);
  event LockDeegistered(address indexed owner, bytes32 indexed eventId, address indexed lockAddress);

  //todo: waht is those become huge? do we even care?
  mapping(address => OrganizationData) private _userOrganizations;
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
    require(_isUserLockOwner(msg.sender,lock), "USER_NOT_OWNER");  //fast and 0 gas checks
    _;
  }

  function _isUserLockOwner(address user, address lock) internal view returns(bool){
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
      _outwavePaymentAddress  = paymentAddr;
      _allowLockCreation = true;
  }

  /* manages organization lock collection */ 

  function _registerNewOrganization(address ownerAddress, address entityAddress) internal {
    if(_userOrganizations[ownerAddress].exists) revert();
    _userOrganizations[ownerAddress].exists = true;
    _userOrganizations[ownerAddress].organizationAddress = entityAddress;
    _users.push(ownerAddress);
  }

  function _isOrganizationAddressEntity(address ownerAddress) internal view returns(bool isIndeed) {
      return _userOrganizations[ownerAddress].exists;
  }

  function _isLockAddressEntity(address ownerAddress, address entityAddress) internal view returns(bool isIndeed) {
      return _userOrganizations[ownerAddress].locksEntity[entityAddress].exists ;
  }
  
  function _eventLockRegister(address ownerAddress, bytes32 eventId, address[] memory entityAdresses, uint8[] memory royalies) internal {
    for (uint i = 0; i < entityAdresses.length; i++){
        if(_isLockAddressEntity(ownerAddress, entityAdresses[i])) revert("CORE_LOCK_ADDRESS_EXISTS");
        Lock memory newLock =  Lock({eventId: eventId, royalty: royalies[i], exists : true, lockAddr : entityAdresses[i] });
        _userOrganizations[ownerAddress].locks.push(newLock);
        _userOrganizations[ownerAddress].locksEntity[entityAdresses[i]] = newLock;
        emit LockRegistered(ownerAddress, eventId, entityAdresses[i], address(this));
    }
  }

  function _eventLockDeregister(address ownerAddress, address entityAddress) internal {
      if(_isLockAddressEntity(ownerAddress, entityAddress)) revert("CORE_USER_NOT_OWNER");
      _userOrganizations[ownerAddress].locksEntity[entityAddress].exists = false;
      for(uint i=0; i < _userOrganizations[ownerAddress].locks.length ; i++){
        if(_userOrganizations[ownerAddress].locks[i].lockAddr == entityAddress){
          _userOrganizations[ownerAddress].locks[i].exists = false;
          emit LockDeegistered(ownerAddress, _userOrganizations[ownerAddress].locks[i].eventId, _userOrganizations[ownerAddress].locks[i].lockAddr);
          break;
        }
      }
  }

  /* public */

  function eventLocksGetAll() public view returns(Lock[] memory){
    return _userOrganizations[msg.sender].locks;  
  }

  function eventLocksGetAll(bytes32 eventId) public view returns(Lock[] memory){
    Lock[] memory locks = _userOrganizations[msg.sender].locks;
    //WTF https://stackoverflow.com/questions/68010434/why-cant-i-return-dynamic-array-in-solidity
    uint count;
    for (uint i = 0; i < locks.length; i++) {
      if(locks[i].eventId == eventId){
        count++;
      }
    }
    uint returnIndex;
    Lock[] memory result = new Lock[](count);
    for (uint i = 0; i < locks.length; i++) {
      if(locks[i].eventId == eventId){
        result[returnIndex] = locks[i];
        returnIndex;
      }
    }
    return result;
  }

  function isOutwaveLock(address _lockAddress) public view returns(bool isIndeed) {
    for (uint i = 0; i < _users.length; i++) {
      address ownerAddress = _users[i];
      if(_userOrganizations[ownerAddress].locksEntity[_lockAddress].exists)
        return true;
    }
    return false;
  }
}