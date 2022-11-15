// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./utils/ERC721EnumerableUpgradeable.sol";
import "./interfaces/IOutwaveUnlock.sol";
import "./interfaces/IOutwavePublicLock.sol";
import "./interfaces/IKeyBurnerSendEvents.sol";

/**
 * @title OutwaveKeyBurner
 * @author Raffaele Brivio (demind.io)
 * @notice Burns Unlock Keys coming from Outwave ecosystem, giving back a freshly minted NFT.
 **/
contract OutwaveKeyBurner is
    IKeyBurnerSendEvents,
    Initializable,
    OwnableUpgradeable,
    ERC721Upgradeable,
    ERC721HolderUpgradeable,
    ERC721EnumerableUpgradeable
{
    using Counters for Counters.Counter;
    using AddressUpgradeable for address;

    struct OriginalKey {
        uint256 keyId;
        address lockAddress;
    }

    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => OriginalKey) private _originalKeys;

    IOutwaveUnlock private _unlock;

    function initialize(address unlockAddr)
        public
        initializer
    {
        __Ownable_init();
        super.__ERC721_init("OutwavePartecipantAttestation", "OPA");
        _unlock = IOutwaveUnlock(unlockAddr);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super.transferFrom(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId)
        public
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super.approve(to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super.safeTransferFrom(from, to, tokenId, _data);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @notice Burn the key of an Outwave Lock
     * @param parent The address of the parent PublicLock
     * @param tokenId The id of the PublickLock key to be burned
     */
    function burnKey(
        address parent,
        uint256 tokenId
    ) external {
        (bool deployed, , ) = _unlock.locks(parent);
        require(deployed, "LOCK_NOT_DEPLOYED");
        IOutwavePublicLock parentLock = IOutwavePublicLock(parent);
        // require(
        //     deployed && parentLock.isLockManager(address(_outwave)),
        //     "NOT_PUBLIC_LOCK"
        // );

        // NOTE: this checks will be probably moved to backend application
        // address eventOwner = _outwave.eventOwner(eventHash);
        // require(eventOwner != address(0), "OWNER_NOT_FOUND");
        // bytes32 retrievedEventHash = _outwave.eventByLock(parent, eventOwner);
        // require(retrievedEventHash != bytes32(0), "EVENT_LOCK_MISMATCH");

        // generate tokenId for OPA
        uint256 newOpaTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // store tokenUri
        _originalKeys[newOpaTokenId] = OriginalKey(tokenId, parent);

        emit KeyBurn(msg.sender, parent, tokenId, newOpaTokenId);

        // mint the OPA and burn the public lock's key
        parentLock.burn(tokenId);
        _safeMint(msg.sender, newOpaTokenId);
    }

    function balanceOf(address owner)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (uint256)
    {
        return super.balanceOf(owner);
    }

    function getApproved(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super.getApproved(tokenId);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.isApprovedForAll(owner, operator);
    }

    function ownerOf(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super.ownerOf(tokenId);
    }

    // Returns the json of the corresponding token ID.
    // Used for getting things like the NFT's name, properties, description etc.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable)
        returns (string memory)
    {
        // (keyBurnerAddress, opaTokenId) => {lockTokenURI}/burned
        require(_exists(tokenId), "TOKENID_NOT_EXISTS");
        assert(_originalKeys[tokenId].keyId != 0);

        IOutwavePublicLock parentLock = IOutwavePublicLock(
            _originalKeys[tokenId].lockAddress
        );

        return
            string(
                bytes.concat(
                    bytes(parentLock.tokenURI(_originalKeys[tokenId].keyId)),
                    abi.encodePacked("/burned")
                )
            );
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    )
        public
        pure
        override(ERC721HolderUpgradeable, IERC721ReceiverUpgradeable)
        returns (bytes4)
    {
        return this.onERC721Received.selector;
    }

    function readUnlock() external view returns (address) {
        return address(_unlock);
    }

    function readOriginalKey(uint256 tokenId)
        public
        view
        returns (OriginalKey memory originalKey)
    {
        require(_exists(tokenId), "TOKENID_NOT_EXISTS");
        return _originalKeys[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
