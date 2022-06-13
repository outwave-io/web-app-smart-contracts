// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.17 <0.9.0;

//https://docs.unlock-protocol.com/unlock/developers/smart-contracts/lock-api#getters
interface IEventLock {
    function name() external view returns (string memory _name);

    function numberOfOwners() external view returns (uint);

    function symbol() external view returns (string memory);

    function tokenURI(uint256 _tokenId) external view returns (string memory);

    function onKeyPurchaseHook() external view returns (address);

    function onKeyCancelHook() external view returns (address);

    function beneficiary() external view returns (address);

    function expirationDuration() external view returns (uint256);

    function freeTrialLength() external view returns (uint256);

    function tokenAddress() external view returns (address);

    function keyPrice() external view returns (uint256);

    function maxNumberOfKeys() external view returns (uint256);

    function keyManagerOf(uint) external view returns (address);

    function refundPenaltyBasisPoints() external view returns (uint256);

    function transferFeeBasisPoints() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256 balance);

    function publicLockVersion() external pure returns (uint16);

    function ownerOf(uint256 tokenId) external view returns (address _owner);

    function purchase(uint256[] calldata _values,
        address[] calldata _recipients,
        address[] calldata _referrers,
        address[] calldata _keyManagers,
        bytes[] calldata _data
    ) external payable;
  
}
