// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";
import "../ILockTokenURIHook.sol";

import "./EventCoreMixin.sol";
import "hardhat/console.sol";

/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract EventTokenUriHookMixin is EventCoreMixin, ILockTokenURIHook {

 /**
   * @notice If the lock owner has registered an implementer
   * then this hook is called every time `tokenURI()` is called
   * @param lockAddress the address of the lock
   * @param operator the msg.sender issuing the call
   * @param owner the owner of the key for which we are retrieving the `tokenUri`
   * @param keyId the id (tokenId) of the key (if applicable)
   * @param expirationTimestamp the key expiration timestamp
   * @return the tokenURI
   */
  function tokenURI(
    address lockAddress,
    address operator,
    address owner,
    uint256 keyId,
    uint expirationTimestamp
  ) external view override returns(string memory){
    return string(bytes.concat(bytes(_getBaseTokenUri()), bytes("0x"), bytes(toAsciiString(lockAddress))));
  }

  function toAsciiString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint i = 0; i < 20; i++) {
        bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
        bytes1 hi = bytes1(uint8(b) / 16);
        bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
        s[2*i] = char(hi);
        s[2*i+1] = char(lo);            
    }
    return string(s);
}

function char(bytes1 b) internal pure returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
}
   
}
