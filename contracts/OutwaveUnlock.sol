// SPDX-License-Identifier: UNLICENSED
// based on: https://github.com/unlock-protocol/unlock/blob/master/packages/contracts/src/contracts/Unlock/UnlockV11.sol
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IOutwavePublicLock.sol";
import "./OutwavePublicLock.sol";

contract OutwaveUnlock is Initializable, PausableUpgradeable, OwnableUpgradeable
{

  /**
   * The struct for a lock
   * We use deployed to keep track of deployments.
   * This is required because both totalSales and yieldedDiscountTokens are 0 when initialized,
   * which would be the same values when the lock is not set.
   */
  struct LockBalances
  {
    bool deployed;
    uint totalSales; // This is in wei
    uint yieldedDiscountTokens;
  }

  // We keep track of deployed locks to ensure that callers are all deployed locks.
  mapping (address => LockBalances) public locks;

    // Events
  event NewLock(
    address indexed lockOwner,
    address indexed newLockAddress
  );

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
     _disableInitializers();
  }

  function initialize() initializer public {
    __Pausable_init();
    __Ownable_init();
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  /**
  * @notice Create lock
  * This deploys a lock for a creator. It also keeps track of the deployed lock.
  * @param _expirationDuration the duration of the lock (pass 0 for unlimited duration)
  * @param _tokenAddress set to the ERC20 token address, or 0 for ETH.
  * @param _keyPrice the price of each key
  * @param _maxNumberOfKeys the maximum nimbers of keys to be edited
  * @param _lockName the name of the lock
  * param _salt [deprec] -- kept only for backwards copatibility
  * This may be implemented as a sequence ID or with RNG. It's used with `create2`
  * to know the lock's address before the transaction is mined.
  * @dev internally call `createUpgradeableLock`
  */
  function createLock(
    uint _expirationDuration,
    address _tokenAddress,
    uint _keyPrice,
    uint _maxNumberOfKeys,
    string calldata _lockName,
    bytes12 // _salt
  ) external returns(address)
  {
    // deploy a not upgradable instance
    OutwavePublicLock newLock = new OutwavePublicLock();
    newLock.initialize(payable(msg.sender),
        _expirationDuration,
        _tokenAddress,
        _keyPrice,
        _maxNumberOfKeys,
        _lockName);

    address payable lockAddress = payable(address(newLock));

    locks[lockAddress] = LockBalances({
      deployed: true, totalSales: 0, yieldedDiscountTokens: 0
    });

    // trigger event
    emit NewLock(msg.sender, lockAddress);
    return lockAddress;
  }

}
