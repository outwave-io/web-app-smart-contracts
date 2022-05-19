// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

//https://docs.unlock-protocol.com/unlock/developers/smart-contracts/lock-api#getters
interface IEventManager
{
  function eventCreate(
        uint256 eventId,
        string[] memory names,
        uint256[] memory keyprices,
        uint256[] memory numberOfKeys,
        uint8[] memory royalties,
        string[] memory baseTokenUris
  ) external returns (address[] memory);

  function eventLockCreate(
        uint256 eventId, //todo: review this
        string[] memory names,
        uint256[] memory keyprices,
        uint256[] memory numberOfKeys,
        uint8[] memory royalties,
        string[] memory baseTokenUris
  ) external returns (address[] memory);

  function eventDisable(
    uint256 eventId
  ) external;
  
  function eventLockDisable(
    address lockAddress
  ) external;

  function eventWithdraw(
    uint256 eventId
  ) external;

  function eventUpdateKeyPricing(
    address lockAddress,
    uint256 keyPrice
  ) external;

    function eventSetMaxNumberOfKeys(
      address lockAddress,
      uint256 maxNumberOfKeys
  ) external;

  function eventUpdateLockSymbol(
      address lockAddress,
      string calldata lockSymbol
  ) external;

  function eventSetBaseTokenURI(
      address lockAddress,
      string calldata baseTokenURI
  ) external;


}