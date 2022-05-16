// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

//https://docs.unlock-protocol.com/unlock/developers/smart-contracts/lock-api#getters
interface IReadLock
{
  function name() external view returns (string memory _name);
  function numberOfOwners() external view returns (uint);
  function symbol() external view returns(string memory);
  function tokenURI(uint256 _tokenId) external view returns(string memory);
  function onKeyPurchaseHook() external view returns(address);
  function onKeyCancelHook() external view returns(address);
  function beneficiary() external view returns (address );
  function expirationDuration() external view returns (uint256 );
  function freeTrialLength() external view returns (uint256 );
  function isAlive() external view returns (bool );
  function tokenAddress() external view returns (address );
  function keyPrice() external view returns (uint256 );
  function maxNumberOfKeys() external view returns (uint256 );
  function keyManagerOf(uint) external view returns (address );
  function refundPenaltyBasisPoints() external view returns (uint256 );
  function transferFeeBasisPoints() external view returns (uint256 );
}