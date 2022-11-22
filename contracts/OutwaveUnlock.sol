// based on: https://github.com/unlock-protocol/unlock/blob/master/packages/contracts/src/contracts/Unlock/UnlockV9.sol
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./libraries/Clone2Factory.sol";
import "./interfaces/IOutwaveUnlock.sol";

/**
* @title The OutwavePublicLock Interface intialization parameters
 */
struct PublicLockInitParams
{
    address payable lockCreator;
    uint expirationDuration;
    address tokenAddress;
    uint keyPrice;
    uint maxNumberOfKeys;
    string lockName;
    string lockTokenURI;
    address payable outwavePaymentAddress;
    uint16 lockFeePercent;   
    uint maxKeysPerAddress;
}

/**
* @title The PublicLock Interface
 */
abstract contract IOutwavePublicLock
{

// See indentationissue description here:
// https://github.com/duaraghav8/Ethlint/issues/268
// solium-disable indentation

  /// Functions

  function initialize(
    PublicLockInitParams calldata _params
  ) virtual external;

//   /**
//    * @notice Allow the contract to accept tips in ETH sent directly to the contract.
//    * @dev This is okay to use even if the lock is priced in ERC-20 tokens
//    */
//   function() external payable;

  /**
   * @dev Never used directly
   */
  function initialize() virtual external;

  /**
  * @notice The version number of the current implementation on this network.
  * @return The current version number.
  */
  function publicLockVersion() virtual public pure returns (uint);

  /**
  * @notice Gets the current balance of the account provided.
  * @param _tokenAddress The token type to retrieve the balance of.
  * @param _account The account to get the balance of.
  * @return The number of tokens of the given type for the given address, possibly 0.
  */
  function getBalance(
    address _tokenAddress,
    address _account
  ) virtual external view
    returns (uint);

  /**
  * @notice Used to disable lock before migrating keys and/or destroying contract.
  * @dev Throws if called by other than a lock manager.
  * @dev Throws if lock contract has already been disabled.
  */
  function disableLock() virtual external;

  /**
   * @dev Called by a lock manager or beneficiary to withdraw all funds from the lock and send them to the `beneficiary`.
   * @dev Throws if called by other than a lock manager or beneficiary
   * @param _tokenAddress specifies the token address to withdraw or 0 for ETH. This is usually
   * the same as `tokenAddress` in MixinFunds.
   * @param _amount specifies the max amount to withdraw, which may be reduced when
   * considering the available balance. \ to 0 or MAX_UINT to withdraw everything.
   *  -- however be wary of draining funds as it breaks the `cancelAndRefund` and `expireAndRefundFor`
   * use cases.
   */
  function withdraw(
    address _tokenAddress,
    uint _amount
  ) virtual external;

  /**
   * @notice An ERC-20 style approval, allowing the spender to transfer funds directly from this lock.
   * @param _spender address that can spend tokens belonging to the lock
   * @param _amount amount of tokens that can be spent by the spender
   */
  function approveBeneficiary(
    address _spender,
    uint _amount
  ) virtual external
    returns (bool);

  /**
   * A function which lets a Lock manager of the lock to change the price for future purchases.
   * @dev Throws if called by other than a Lock manager
   * @dev Throws if lock has been disabled
   * @dev Throws if _tokenAddress is not a valid token
   * @param _keyPrice The new price to set for keys
   * @param _tokenAddress The address of the erc20 token to use for pricing the keys,
   * or 0 to use ETH
   */
  function updateKeyPricing( uint _keyPrice, address _tokenAddress ) virtual external;

  /**
   * A function which lets a Lock manager update the beneficiary account,
   * which receives funds on withdrawal.
   * @dev Throws if called by other than a Lock manager or beneficiary
   * @dev Throws if _beneficiary is address(0)
   * @param _beneficiary The new address to set as the beneficiary
   */
  function updateBeneficiary( address _beneficiary ) virtual external;

    /**
   * Checks if the user has a non-expired key.
   * @param _user The address of the key owner
   */
  function getHasValidKey(
    address _user
  ) virtual external view returns (bool);

  /**
   * @notice Find the tokenId for a given user
   * @return The tokenId of the NFT, else returns 0
   * @param _account The address of the key owner
  */
  function getTokenIdFor(
    address _account
  ) virtual external view returns (uint);

  /**
  * A function which returns a subset of the keys for this Lock as an array
  * @param _page the page of key owners requested when faceted by page size
  * @param _pageSize the number of Key Owners requested per page
  * @dev Throws if there are no key owners yet
  */
  function getOwnersByPage(
    uint _page,
    uint _pageSize
  ) virtual external view returns (address[] memory);

  /**
   * Checks if the given address owns the given tokenId.
   * @param _tokenId The tokenId of the key to check
   * @param _keyOwner The potential key owners address
   */
  function isKeyOwner(
    uint _tokenId,
    address _keyOwner
  ) virtual external view returns (bool);

  /**
  * @dev Returns the key's ExpirationTimestamp field for a given owner.
  * @param _keyOwner address of the user for whom we search the key
  * @dev Returns 0 if the owner has never owned a key for this lock
  */
  function keyExpirationTimestampFor(
    address _keyOwner
  ) virtual external view returns (uint timestamp);

  /**
   * Public function which returns the total number of unique owners (both expired
   * and valid).  This may be larger than totalSupply.
   */
  function numberOfOwners() virtual external view returns (uint);

  /**
   * Allows a Lock manager to assign a descriptive name for this Lock.
   * @param _lockName The new name for the lock
   * @dev Throws if called by other than a Lock manager
   */
  function updateLockName(
    string calldata _lockName
  ) virtual external;

  /**
   * Allows a Lock manager to assign a Symbol for this Lock.
   * @param _lockSymbol The new Symbol for the lock
   * @dev Throws if called by other than a Lock manager
   */
  function updateLockSymbol(
    string calldata _lockSymbol
  ) virtual external;

  /**
    * @dev Gets the token symbol
    * @return string representing the token symbol
    */
  function symbol()
    virtual external view
    returns(string memory);

    /**
   * Allows a Lock manager to update the baseTokenURI for this Lock.
   * @dev Throws if called by other than a Lock manager
   * @param _baseTokenURI String representing the base of the URI for this lock.
   */
  function setBaseTokenURI(
    string calldata _baseTokenURI
  ) virtual external;

  /**  @notice A distinct Uniform Resource Identifier (URI) for a given asset.
   * @dev Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC
   *  3986. The URI may point to a JSON file that conforms to the "ERC721
   *  Metadata JSON Schema".
   * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
   * @param _tokenId The tokenID we're inquiring about
   * @return String representing the URI for the requested token
   */
  function tokenURI(
    uint256 _tokenId
  ) virtual external view returns(string memory);

//   /**
//    * Allows a Lock manager to add or remove an event hook
//    * @param _onKeyPurchaseHook Hook called when the `purchase` function is called
//    * @param _onKeyCancelHook Hook called when the internal `_cancelAndRefund` function is called
//    */
//   function setEventHooks(
//     address _onKeyPurchaseHook,
//     address _onKeyCancelHook
//   ) virtual external;

  /**
   * Allows a Lock manager to give a collection of users a key with no charge.
   * Each key may be assigned a different expiration date.
   * @dev Throws if called by other than a Lock manager
   * @param _recipients An array of receiving addresses
   * @param _expirationTimestamps An array of expiration Timestamps for the keys being granted
   */
  function grantKeys(
    address[] calldata _recipients,
    uint[] calldata _expirationTimestamps,
    address[] calldata _keyManagers
  ) virtual external;

  /**
  * @dev Purchase function
  * @param _value the number of tokens to pay for this purchase >= the current keyPrice - any applicable discount
  * (_value is ignored when using ETH)
  * @param _recipient address of the recipient of the purchased key
  * @param _referrer address of the user making the referral
  * @param _data arbitrary data populated by the front-end which initiated the sale
  * @dev Throws if lock is disabled. Throws if lock is sold-out. Throws if _recipient == address(0).
  * @dev Setting _value to keyPrice exactly doubles as a security feature. That way if a Lock manager increases the
  * price while my transaction is pending I can't be charged more than I expected (only applicable to ERC-20 when more
  * than keyPrice is approved for spending).
  */
  function purchase(
    uint256 _value,
    address _recipient,
    address _referrer,
    bytes calldata _data
  ) virtual external payable;

//   /**
//    * @notice returns the minimum price paid for a purchase with these params.
//    * @dev this considers any discount from OutwaveUnlock or the OnKeyPurchase hook.
//    */
//   function purchasePriceFor(
//     address _recipient,
//     address _referrer,
//     bytes calldata _data
//   ) virtual external view
//     returns (uint);

  /**
   * Allow a Lock manager to change the transfer fee.
   * @dev Throws if called by other than a Lock manager
   * @param _transferFeeBasisPoints The new transfer fee in basis-points(bps).
   * Ex: 200 bps = 2%
   */
  function updateTransferFee(
    uint _transferFeeBasisPoints
  ) virtual external;

  /**
   * Determines how much of a fee a key owner would need to pay in order to
   * transfer the key to another account.  This is pro-rated so the fee goes down
   * overtime.
   * @dev Throws if _keyOwner does not have a valid key
   * @param _keyOwner The owner of the key check the transfer fee for.
   * @param _time The amount of time to calculate the fee for.
   * @return The transfer fee in seconds.
   */
  function getTransferFee(
    address _keyOwner,
    uint _time
  ) virtual external view returns (uint);

  /**
   * @dev Invoked by a Lock manager to expire the user's key and perform a refund and cancellation of the key
   * @param _keyOwner The key owner to whom we wish to send a refund to
   * @param amount The amount to refund the key-owner
   * @dev Throws if called by other than a Lock manager
   * @dev Throws if _keyOwner does not have a valid key
   */
  function expireAndRefundFor(
    address _keyOwner,
    uint amount
  ) virtual external;

   /**
   * @dev allows the key manager to expire a given tokenId
   * and send a refund to the keyOwner based on the amount of time remaining.
   * @param _tokenId The id of the key to cancel.
   */
  function cancelAndRefund(uint _tokenId) virtual external;

  /**
   * @dev Cancels a key managed by a different user and sends the funds to the keyOwner.
   * @param _keyManager the key managed by this user will be canceled
   * @param _v _r _s getCancelAndRefundApprovalHash signed by the _keyManager
   * @param _tokenId The key to cancel
   */
  function cancelAndRefundFor(
    address _keyManager,
    uint8 _v,
    bytes32 _r,
    bytes32 _s,
    uint _tokenId
  ) virtual external;

  /**
   * @notice Sets the minimum nonce for a valid off-chain approval message from the
   * senders account.
   * @dev This can be used to invalidate a previously signed message.
   */
  function invalidateOffchainApproval(
    uint _nextAvailableNonce
  ) virtual external;

  /**
   * Allow a Lock manager to change the refund penalty.
   * @dev Throws if called by other than a Lock manager
   * @param _freeTrialLength The new duration of free trials for this lock
   * @param _refundPenaltyBasisPoints The new refund penaly in basis-points(bps)
   */
  function updateRefundPenalty(
    uint _freeTrialLength,
    uint _refundPenaltyBasisPoints
  ) virtual external;

  /**
   * @dev Determines how much of a refund a key owner would receive if they issued
   * @param _keyOwner The key owner to get the refund value for.
   * a cancelAndRefund block.timestamp.
   * Note that due to the time required to mine a tx, the actual refund amount will be lower
   * than what the user reads from this call.
   */
  function getCancelAndRefundValueFor(
    address _keyOwner
  ) virtual external view returns (uint refund);

  function keyManagerToNonce(address ) virtual external view returns (uint256 );

  /**
   * @notice returns the hash to sign in order to allow another user to cancel on your behalf.
   * @dev this can be computed in JS instead of read from the contract.
   * @param _keyManager The key manager's address (also the message signer)
   * @param _txSender The address cancelling cancel on behalf of the keyOwner
   * @return approvalHash The hash to sign
   */
  function getCancelAndRefundApprovalHash(
    address _keyManager,
    address _txSender
  ) virtual external view returns (bytes32 approvalHash);

  function addKeyGranter(address account) virtual external;

  function addLockManager(address account) virtual external;

  function isKeyGranter(address account) virtual external view returns (bool);

  function isLockManager(address account) virtual external view returns (bool);

  function onKeyPurchaseHook() virtual external view returns(address);

  function onKeyCancelHook() virtual external view returns(address);

  function revokeKeyGranter(address _granter) virtual external;

  function renounceLockManager() virtual external;

  ///===================================================================
  /// Auto-generated getter functions from public state variables

  function beneficiary() virtual external view returns (address );

  function expirationDuration() virtual external view returns (uint256 );

  function freeTrialLength() virtual external view returns (uint256 );

  function isAlive() virtual external view returns (bool );

  function keyPrice() virtual external view returns (uint256 );

  function maxNumberOfKeys() virtual external view returns (uint256 );

  function owners(uint256 ) virtual external view returns (address );

  function refundPenaltyBasisPoints() virtual external view returns (uint256 );

  function tokenAddress() virtual external view returns (address );

  function transferFeeBasisPoints() virtual external view returns (uint256 );

  function unlockProtocol() virtual external view returns (address );

  function keyManagerOf(uint) virtual external view returns (address );

  ///===================================================================

  /**
  * @notice Allows the key owner to safely share their key (parent key) by
  * transferring a portion of the remaining time to a new key (child key).
  * @dev Throws if key is not valid.
  * @dev Throws if `_to` is the zero address
  * @param _to The recipient of the shared key
  * @param _tokenId the key to share
  * @param _timeShared The amount of time shared
  * checks if `_to` is a smart contract (code size > 0). If so, it calls
  * `onERC721Received` on `_to` and throws if the return value is not
  * `bytes4(keccak256('onERC721Received(address,address,uint,bytes)'))`.
  * @dev Emit Transfer event
  */
  function shareKey(
    address _to,
    uint _tokenId,
    uint _timeShared
  ) virtual external;

  /**
  * @notice Update transfer and cancel rights for a given key
  * @param _tokenId The id of the key to assign rights for
  * @param _keyManager The address to assign the rights to for the given key
  */
  function setKeyManagerOf(
    uint _tokenId,
    address _keyManager
  ) virtual external;

  /// @notice A descriptive name for a collection of NFTs in this contract
  function name() virtual external view returns (string memory _name);
  ///===================================================================

  /// From ERC165.sol
  function supportsInterface(bytes4 interfaceId) virtual external view returns (bool );
  ///===================================================================

  /// From ERC-721
  /**
     * @dev Returns the number of NFTs in `owner`'s account.
     */
    function balanceOf(address _owner) virtual public view returns (uint256 balance);

    /**
     * @dev Returns the owner of the NFT specified by `tokenId`.
     */
    function ownerOf(uint256 tokenId) virtual public view returns (address _owner);

    /**
     * @dev Transfers a specific NFT (`tokenId`) from one account (`from`) to
     * another (`to`).
     *
     *
     *
     * Requirements:
     * - `from`, `to` cannot be zero.
     * - `tokenId` must be owned by `from`.
     * - If the caller is not `from`, it must be have been allowed to move this
     * NFT by either {approve} or {setApprovalForAll}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) virtual public;
    /**
     * @dev Transfers a specific NFT (`tokenId`) from one account (`from`) to
     * another (`to`).
     *
     * Requirements:
     * - If the caller is not `from`, it must be approved to move this NFT by
     * either {approve} or {setApprovalForAll}.
     */
    function transferFrom(address from, address to, uint256 tokenId) virtual public;
    function approve(address to, uint256 tokenId) virtual public;

    /**
    * @notice Get the approved address for a single NFT
    * @dev Throws if `_tokenId` is not a valid NFT.
    * @param _tokenId The NFT to find the approved address for
    * @return operator The approved address for this NFT, or the zero address if there is none
    */
    function getApproved(uint256 _tokenId) virtual public view returns (address operator);

    function setApprovalForAll(address operator, bool _approved) virtual public;
    function isApprovedForAll(address _owner, address operator) virtual public view returns (bool);

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) virtual public;

    function totalSupply() virtual public view returns (uint256);
    function tokenOfOwnerByIndex(address _owner, uint256 index) virtual public view returns (uint256 tokenId);

    function tokenByIndex(uint256 index) virtual public view returns (uint256);



    /**
     * @notice An ERC-20 style transfer.
     * @param _value sends a token with _value * expirationDuration (the amount of time remaining on a standard purchase).
     * @dev The typical use case would be to call this with _value 1, which is on par with calling `transferFrom`. If the user
     * has more than `expirationDuration` time remaining this may use the `shareKey` function to send some but not all of the token.
     */
    function transfer(
      address _to,
      uint _value
    ) virtual external
      returns (bool success);
}


interface IMintableERC20
{
  function mint(address account, uint256 amount) external returns (bool);
  function transfer(address recipient, uint256 amount) external returns (bool);
  function totalSupply() external returns (uint);
  function balanceOf(address account) external returns (uint256);
}


/**
 * @title The OutwaveUnlock contract
 * @author Julien Genestoux (unlock-protocol.com)
 * This smart contract has 3 main roles:
 *  1. Distribute discounts to discount token holders
 *  2. Grant dicount tokens to users making referrals and/or publishers granting discounts.
 *  3. Create & deploy Public Lock contracts.
 * In order to achieve these 3 elements, it keeps track of several things such as
 *  a. Deployed locks addresses and balances of discount tokens granted by each lock.
 *  b. The total network product (sum of all key sales, net of discounts)
 *  c. Total of discounts granted
 *  d. Balances of discount tokens, including 'frozen' tokens (which have been used to claim
 * discounts and cannot be used/transferred for a given period)
 *  e. Growth rate of Network Product
 *  f. Growth rate of Discount tokens supply
 * The smart contract has an owner who only can perform the following
 *  - Upgrades
 *  - Change in golden rules (20% of GDP available in discounts, and supply growth rate is at most
 * 50% of GNP growth rate)
 * NOTE: This smart contract is partially implemented for now until enough Locks are deployed and
 * in the wild.
 * The partial implementation includes the following features:
 *  a. Keeping track of deployed locks
 *  b. Keeping track of GNP
 */
/// @dev Must list the direct base contracts in the order from “most base-like” to “most derived”.
/// https://solidity.readthedocs.io/en/latest/contracts.html#multiple-inheritance-and-linearization
contract OutwaveUnlock is
  IOutwaveUnlock,
  Initializable,
  OwnableUpgradeable
{
  using AddressUpgradeable for address;
  using Clone2Factory for address;
  using SafeMath for uint;

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

  modifier onlyFromDeployedLock() {
    require(locks[msg.sender].deployed, 'ONLY_LOCKS');
    _;
  }

  uint public grossNetworkProduct;

  uint public totalDiscountGranted;

  // We keep track of deployed locks to ensure that callers are all deployed locks.
  mapping (address => LockBalances) public locks;

  // global base token URI
  // Used by locks where the owner has not set a custom base URI.
  string public globalBaseTokenURI;

  // global base token symbol
  // Used by locks where the owner has not set a custom symbol
  string public globalTokenSymbol;

  // The address of the public lock template, used when `createLock` is called
  address public publicLockAddress;

  // The WETH token address, used for value calculations
  address public weth;

  // The UDT token address, used to mint tokens on referral
  address public udt;

  // The approx amount of gas required to purchase a key
  uint public estimatedGasForPurchase;

  // Blockchain ID the network id on which this version of OutwaveUnlock is operating
  uint public chainId;

  // Fee percentage, applied to NTFs sell price, earned by Outwave 
  uint16 private _lockFeePercent;

  // Events
  event NewLock(
    address indexed lockOwner,
    address indexed newLockAddress,
    bytes12 indexed salt
  );

  event ConfigUnlock(
    address udt,
    address weth,
    uint estimatedGasForPurchase,
    string globalTokenSymbol,
    string globalTokenURI,
    uint chainId
  );

  event SetLockTemplate(
    address publicLockAddress
  );

  event ResetTrackedValue(
    uint grossNetworkProduct,
    uint totalDiscountGranted
  );

  // Use initialize instead of a constructor to support proxies (for upgradeability via zos).
  function initialize()
    public
    override(IOutwaveUnlock)
    initializer()
  {
    __Ownable_init();
  }

  /**
  * @dev Create lock
  * This deploys a lock for a creator. It also keeps track of the deployed lock.
  * @param _tokenAddress set to the ERC20 token address, or 0 for ETH.
  * @param _salt an identifier for the Lock, which is unique for the user.
  * This may be implemented as a sequence ID or with RNG. It's used with `create2`
  * to know the lock's address before the transaction is mined.
  * @return the address of the new lock
  */
  function createLock(
    uint _expirationDuration,
    address _tokenAddress,
    uint _keyPrice,
    uint _maxNumberOfKeys,
    string calldata _lockName,
    bytes12 _salt,
    address payable _outwavePaymentAddress,
    uint16 _lockFeePerc,
    uint _maxKeysPerAddress
  ) public returns(address)
  {
    require(publicLockAddress != address(0), 'MISSING_LOCK_TEMPLATE');

    // create lock
    bytes32 salt;
    // solium-disable-next-line
    assembly
    {
      let pointer := mload(0x40)
      // The salt is the msg.sender
      mstore(pointer, shl(96, caller()))
      // followed by the _salt provided
      mstore(add(pointer, 0x14), _salt)
      salt := mload(pointer)
    }
    address payable newLock = payable(publicLockAddress.createClone2(salt));
    PublicLockInitParams memory _params;
    _params.lockCreator = payable(msg.sender);
    _params.expirationDuration = _expirationDuration;
    _params.tokenAddress = _tokenAddress;
    _params.keyPrice = _keyPrice;
    _params.maxNumberOfKeys = _maxNumberOfKeys;
    _params.lockName = _lockName;
    _params.outwavePaymentAddress = _outwavePaymentAddress;
    _params.lockFeePercent = _lockFeePerc;
    _params.maxKeysPerAddress = _maxKeysPerAddress;
    _msgSender();
    IOutwavePublicLock(newLock).initialize(_params);

    // Assign the new Lock
    locks[newLock] = LockBalances({
      deployed: true, totalSales: 0, yieldedDiscountTokens: 0
    });

    // trigger event
    emit NewLock(msg.sender, newLock, _salt);

    return address(newLock);
  }

  /**
   * This function returns the discount available for a user, when purchasing a
   * a key from a lock.
   * This does not modify the state. It returns both the discount and the number of tokens
   * consumed to grant that discount.
   * TODO: actually implement this.
   */
  function computeAvailableDiscountFor(
    address /* _purchaser */,
    uint /* _keyPrice */
  )
    public
    pure
    returns (uint discount, uint tokens)
  {
    // TODO: implement me
    return (0, 0);
  }

  /**
   * This function will keep track of consumed discounts by a given user.
   * It will also grant discount tokens to the creator who is granting the discount based on the
   * amount of discount and compensation rate.
   * This function is invoked by a previously deployed lock only.
   */
  function recordConsumedDiscount(
    uint _discount,
    uint /* _tokens */
  )
    public
    onlyFromDeployedLock()
  {
    // TODO: implement me
    totalDiscountGranted += _discount;
    return;
  }

  // The version number of the current OutwaveUnlock implementation on this network
  function unlockVersion(
  ) external pure
    returns (uint16)
  {
    return 1;
  }

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
  ) external
    onlyOwner
  {
    udt = _udt;
    weth = _weth;
    estimatedGasForPurchase = _estimatedGasForPurchase;

    globalTokenSymbol = _symbol;
    globalBaseTokenURI = _URI;

    chainId = _chainId;

    emit ConfigUnlock(_udt, _weth, _estimatedGasForPurchase, _symbol, _URI, _chainId);
  }

  /**
   * @notice Upgrade the PublicLock template used for future calls to `createLock`.
   * @dev This will initialize the template and revokeOwnership.
   */
  function setLockTemplate(
    address payable _publicLockAddress
  ) external
    onlyOwner
  {
    require(_publicLockAddress != address(0), 'PUBLIC_LOCK_CANT_BE_ADDRESS_ZERO');
    require(publicLockAddress == address(0), "PUBLIC_LOCK_ALREADY_SET");

    publicLockAddress = _publicLockAddress;

    emit SetLockTemplate(_publicLockAddress);
  }

  // Allows the owner to change the value tracking variables as needed.
  function resetTrackedValue(
    uint _grossNetworkProduct,
    uint _totalDiscountGranted
  ) external
    onlyOwner
  {
    grossNetworkProduct = _grossNetworkProduct;
    totalDiscountGranted = _totalDiscountGranted;

    emit ResetTrackedValue(_grossNetworkProduct, _totalDiscountGranted);
  }

  /**
   * @dev Redundant with globalBaseTokenURI() for backwards compatibility with v3 & v4 locks.
   */
  function getGlobalBaseTokenURI()
    external
    view
    returns (string memory)
  {
    return globalBaseTokenURI;
  }

  /**
   * @dev Redundant with globalTokenSymbol() for backwards compatibility with v3 & v4 locks.
   */
  function getGlobalTokenSymbol()
    external
    view
    returns (string memory)
  {
    return globalTokenSymbol;
  }

  /**
   * This function will set the percentage earned by Outwave for each NFT sold,
   * computed on its price.
   */  
  function setLockFee(uint16 percent)
    external
    onlyOwner
  {
    _lockFeePercent = percent;
  }

  /**
   * This function will return the percentage earned by Outwave for each NFT sold,
   * computed on its price.
   */  
  function getLockFee()
    external
    view
    returns (uint16)
  {
    return _lockFeePercent;  
  }
}
