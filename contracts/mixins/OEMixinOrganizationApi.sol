
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";

import {IUnlockV11 as IUnlock} from  "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";

// todo: ma che cazzo è sta roba...? sembra un bug di hardhat quando compila
//import "../_unlock/PublicLockV10.sol";
//import "../_unlock/UnlockV11.sol";


import '../OutwaveOrganization.sol';
import "./OEMixinCore.sol";
import "hardhat/console.sol";


/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract OEMixinOrganizationApi is OEMixinCore{

 

   // event LockCreated(address indexed lockOwner, address indexed lockAddress);
   // event LockConfigured(address indexed lockAddress, address indexed outwaveEventAddress);
   // event OrganizationCreated(address indexed organizationOwner,address indexed newOrganizationAddress);

/**
   * @notice Updates locks owner to new OutWave Event contract to gain new api.
   * @param lockAddr address of the lock to update
   * @param newOutWaveEventAddr address of the new Outwave Event
   */
function updateLocksApi(
  address lockAddr, 
  address newOutWaveEventAddr
) public{
  //todo 
}

/* functions specific per org - creation */

// //https://ethereum.stackexchange.com/questions/17094/how-to-store-ipfs-hash-using-bytes32
// function createOrganization(
//   bytes32 ipfshash
// ) public returns(address) {
//   require(!_isOrganizationAddressEntity(msg.sender), "ONLY_ONE_ORG");
//   OutwaveOrganization newOrg = new OutwaveOrganization(ipfshash);
//   _registerNewOrganization(msg.sender, address(newOrg));
//   emit  OrganizationCreated((msg.sender), address(newOrg));
//   return address(newOrg);
// }

function eventCreate(
  uint eventId, //todo: review this
  string[] memory names,
  uint[] memory keyprices,
  uint[] memory numberOfKeys,
  uint8[] memory royalties,
  string[] memory baseTokenUris
) public lockAreEnabled returns(address[] memory) {

  console.log("event create called ");
  require(
    (names.length == keyprices.length) &&
    (keyprices.length == numberOfKeys.length) &&
    (numberOfKeys.length == royalties.length) && 
    (royalties.length == baseTokenUris.length), 
    "NOTVALID");

  address[] memory result = new address[](numberOfKeys.length);
  for(uint i; i < keyprices.length; i++){
    address newAddr = _createLock(0, address(0), keyprices[i], numberOfKeys[i], names[i]);
    result[i] = newAddr;
    IPublicLock(newAddr).setBaseTokenURI(baseTokenUris[i]);
  }
  _eventLockRegister(msg.sender,result,royalties);
  return result;
}


/* unlock */

function _createLock(
  uint expirationDuration,
  address tokenAddress,
  uint keyPrice,
  uint maxNumberOfKeys,
  string memory lockName
  // bytes12 // _salt
)  private lockAreEnabled returns(address) {

  bytes memory data = abi.encodeWithSignature(
    'initialize(address,uint256,address,uint256,uint256,string)',
    address(this),
    expirationDuration,
    tokenAddress,
    keyPrice,
    maxNumberOfKeys,
    lockName
  );

  address newlocladd = IUnlock(_unlockAddr).createUpgradeableLock(data);
  IPublicLock(newlocladd).setEventHooks(address(this), address(0), address(0), address(0));
  console.log("new public lock address", newlocladd);
  return newlocladd;
}

/* locks */

// rmeoved in v10... find a different way
// function disableLock(
//   address lockAddress
// )  external onlyLockOwner(lockAddress)  {
//   _deregisterLock(msg.sender, lockAddress);
//    IPublicLock(lockAddress).disableLock();
// }


function grantKeys(
  address lockAddress,
  address[] calldata recipients,
  uint[] calldata expirationTimestamps,
  address[] calldata keyManagers
) external onlyLockOwner(lockAddress) lockAreEnabled {
  IPublicLock(lockAddress).grantKeys(recipients, expirationTimestamps, keyManagers);
}

function withdraw(
  address lockAddress,
  address tokenAddress,
  uint amount
) external onlyLockOwner(lockAddress) {
    uint lockaddressBalance = lockAddress.balance;
    require(lockaddressBalance > 0, "LOCK_NO_FUNDS");
    IPublicLock(lockAddress).withdraw(address(0), lockAddress.balance);
    payable(msg.sender).transfer(lockaddressBalance);
}

function updateKeyPricing( 
  address lockAddress,
  uint keyPrice
) external onlyLockOwner(lockAddress){
   IPublicLock(lockAddress).updateKeyPricing(keyPrice, address(0));
}

function setMaxNumberOfKeys (
  address lockAddress,
  uint maxNumberOfKeys
) external onlyLockOwner(lockAddress){
  IPublicLock(lockAddress).setMaxKeysPerAddress(maxNumberOfKeys);
}


/* ERC721 */
//todo understand if this shall be public or requires onlyLockOwner
function balanceOf (
  address lockAddress, 
  address owner
) public view returns (
  uint256 balance
){
   return IPublicLock(lockAddress).balanceOf(owner);
}


function updateLockSymbol(
  address lockAddress,
  string calldata lockSymbol
) external onlyLockOwner(lockAddress){
  IPublicLock(lockAddress).updateLockSymbol(lockSymbol);
}

function setBaseTokenURI(
  address lockAddress,
  string calldata baseTokenURI
) external onlyLockOwner(lockAddress){
  IPublicLock(lockAddress).setBaseTokenURI(baseTokenURI);
}


function updateTransferFee(
  address lockAddress,
  uint transferFeeBasisPoints
) external onlyLockOwner(lockAddress){
  IPublicLock(lockAddress).updateTransferFee(transferFeeBasisPoints);
}


/* public */
// this are not part of the interface as are defined as public.
// public cannots be used in interfaces. only externals

function publicLockVersion(
   address lockAddress
) 
public pure returns (
  uint
){
   return IPublicLock(lockAddress).publicLockVersion();
}

function ownerOf(
  address lockAddress,
  uint256 tokenId
) public view returns (
  address owner
){
   return IPublicLock(lockAddress).ownerOf(tokenId);
}
 

}
