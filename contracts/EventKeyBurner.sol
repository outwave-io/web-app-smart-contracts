// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {IUnlockV11 as IUnlock} from "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";
import "./interfaces/IReadOutwave.sol";

/**
 * @title OutwaveKeyBurner
 * @author Raffaele Brivio (demind.io)
 * @notice Burns Unlock Keys coming from Outwave ecosystem, giving back a freshly minted NFT.
 **/
contract EventKeyBurner is ERC721, ERC721Holder, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // // key is keccak256("{eventId}:{userAddress}"), useful to tell if a user has already burned a key for a given event
    // mapping(bytes32 => bool) private _eventUserOpa;
    mapping(uint256 => OriginalKey) private _originalKeys;

    IReadOutwave private _outwave;
    IUnlock private _unlock;

    event KeyBurn(
        address indexed from,
        address indexed lock,
        uint256 burnedTokenId,
        uint256 newTokenId
    );

    struct OriginalKey {
        uint256 keyId;
        address lockAddress;
    }

    constructor(address outwaveAddr, address unlockAddr)
        ERC721("OutwavePartecipantAttestation", "OPA")
    {
        _outwave = IReadOutwave(outwaveAddr);
        _unlock = IUnlock(unlockAddr);
    }

    // Returns the json of the corresponding token ID.
    // Used for getting things like the NFT's name, properties, description etc.
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        // (keyBurnerAddress, opaTokenId) => {lockTokenURI}/burned
        require(_exists(tokenId), "TOKENID_NOT_EXISTS");
        assert(_originalKeys[tokenId].keyId != 0);

        IPublicLock parentLock = IPublicLock(
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
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Burn the key of an Outwave Lock
     * @param parent The address of the parent PublicLock
     * @param tokenId The id of the PublickLock key to be burned
     */
    function burnKey(
        address parent,
        uint256 tokenId,
        bytes32 eventHash
    ) external {
        (bool deployed, , ) = _unlock.locks(parent);
        IPublicLock parentLock = IPublicLock(parent);
        require(
            deployed && parentLock.isLockManager(address(_outwave)),
            "NOT_PUBLIC_LOCK"
        );

        parentLock.burn(tokenId);

        // mint the replacing token
        uint256 mintedTokenId = _mintToken(msg.sender);

        address eventOwner = _outwave.eventOwner(eventHash);
        require(eventOwner != address(0), "OWNER_NOT_FOUND");

        bytes32 retrievedEventHash = _outwave.eventByLock(parent, eventOwner);
        require(retrievedEventHash != bytes32(0), "EVENT_LOCK_MISMATCH");

        // store tokenUri
        _originalKeys[mintedTokenId] = OriginalKey(tokenId, parent);

        emit KeyBurn(msg.sender, parent, tokenId, mintedTokenId);
    }

    function readUnlock() external view returns (address) {
        return address(_unlock);
    }

    function readOutwave() external view returns (address) {
        return address(_outwave);
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
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        revert("FEATURE_DISABLED");
    }

    function _mintToken(address to) private returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }
}
