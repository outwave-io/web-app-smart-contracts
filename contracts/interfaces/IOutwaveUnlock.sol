// based on: https://github.com/unlock-protocol/unlock/blob/master/packages/contracts/src/contracts/Unlock/IUnlockV9.sol
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

/**
 * @title The OutwaveUnlock Interface
**/

interface IOutwaveUnlock
{
  // Use initialize instead of a constructor to support proxies(for upgradeability via zos).
  function initialize() external;

  /**
  * @dev Create lock
  * This deploys a lock for a creator. It also keeps track of the deployed lock.
  * @param _tokenAddress set to the ERC20 token address, or 0 for ETH.
  * @param _salt an identifier for the Lock, which is unique for the user.
  * This may be implemented as a sequence ID or with RNG. It's used with `create2`
  * to know the lock's address before the transaction is mined.
  */
  function createLock(
    uint _expirationDuration,
    address _tokenAddress,
    uint _keyPrice,
    uint _maxNumberOfKeys,
    string calldata _lockName,
    string calldata _lockTokenURI,
    bytes12 _salt,
    address payable _outwavePaymentAddress,
    uint8 _lockFeePerc
  ) external returns(address);

//     /**
//    * This function keeps track of the added GDP, as well as grants of discount tokens
//    * to the referrer, if applicable.
//    * The number of discount tokens granted is based on the value of the referal,
//    * the current growth rate and the lock's discount token distribution rate
//    * This function is invoked by a previously deployed lock only.
//    */
//   function recordKeyPurchase(
//     uint _value,
//     address _referrer // solhint-disable-line no-unused-vars
//   )
//     external;

    /**
   * This function will keep track of consumed discounts by a given user.
   * It will also grant discount tokens to the creator who is granting the discount based on the
   * amount of discount and compensation rate.
   * This function is invoked by a previously deployed lock only.
   */
  function recordConsumedDiscount(
    uint _discount,
    uint _tokens // solhint-disable-line no-unused-vars
  )
    external;

    /**
   * This function returns the discount available for a user, when purchasing a
   * a key from a lock.
   * This does not modify the state. It returns both the discount and the number of tokens
   * consumed to grant that discount.
   */
  function computeAvailableDiscountFor(
    address _purchaser, // solhint-disable-line no-unused-vars
    uint _keyPrice // solhint-disable-line no-unused-vars
  )
    external
    view
    returns(uint discount, uint tokens);

  // Function to read the globalTokenURI field.
  function globalBaseTokenURI()
    external
    view
    returns(string memory);

  /**
   * @dev Redundant with globalBaseTokenURI() for backwards compatibility with v3 & v4 locks.
   */
  function getGlobalBaseTokenURI()
    external
    view
    returns (string memory);

  // Function to read the globalTokenSymbol field.
  function globalTokenSymbol()
    external
    view
    returns(string memory);

  // Function to read the chainId field.
  function chainId()
    external
    view
    returns(uint);

  /**
   * @dev Redundant with globalTokenSymbol() for backwards compatibility with v3 & v4 locks.
   */
  function getGlobalTokenSymbol()
    external
    view
    returns (string memory);

  /**
   * @notice Allows the owner to update configuration variables
   */
  function configUnlock(
    address _udt,
    address _weth,
    uint _estimatedGasForPurchase,
    string calldata _symbol,
    string calldata _URI,
    uint _chainId
  )
    external;

  /**
   * @notice Upgrade the PublicLock template used for future calls to `createLock`.
   * @dev This will initialize the template and revokeOwnership.
   */
  function setLockTemplate(
    address payable _publicLockAddress
  ) external;

  // Allows the owner to change the value tracking variables as needed.
  function resetTrackedValue(
    uint _grossNetworkProduct,
    uint _totalDiscountGranted
  ) external;

  function grossNetworkProduct() external view returns(uint);

  function totalDiscountGranted() external view returns(uint);

  function locks(address) external view returns(bool deployed, uint totalSales, uint yieldedDiscountTokens);

  // The address of the public lock template, used when `createLock` is called
  function publicLockAddress() external view returns(address);

  // The WETH token address, used for value calculations
  function weth() external view returns(address);

  // The UDT token address, used to mint tokens on referral
  function udt() external view returns(address);

  // The approx amount of gas required to purchase a key
  function estimatedGasForPurchase() external view returns(uint);

  // The version number of the current OutwaveUnlock implementation on this network
  function unlockVersion() external pure returns(uint16);

//   /**
//    * @dev Returns true if the caller is the current owner.
//    */
//   function isOwner() external view returns(bool);

//   /**
//    * @dev Returns the address of the current owner.
//    */
//   function owner() external view returns(address);

//   /**
//    * @dev Leaves the contract without owner. It will not be possible to call
//    * `onlyOwner` functions anymore. Can only be called by the current owner.
//    *
//    * NOTE: Renouncing ownership will leave the contract without an owner,
//    * thereby removing any functionality that is only available to the owner.
//    */
//   function renounceOwnership() external;

//   /**
//    * @dev Transfers ownership of the contract to a new account (`newOwner`).
//    * Can only be called by the current owner.
//    */
//   function transferOwnership(address newOwner) external;

  /**
   * This function will set the percentage earned by Outwave for each NFT sold,
   * computed on its price.
   */  
  function setLockFee(uint8 percent) external;

    /**
   * This function will return the percentage earned by Outwave for each NFT sold,
   * computed on its price.
   */  
  function getLockFee() external view returns (uint8);
}
