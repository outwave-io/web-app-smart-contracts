// SPDX-License-Identifier: MIT
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
contract OutwaveKeyBurner is ERC721, ERC721Holder, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // // key is keccak256("{eventId}:{userAddress}"), useful to tell if a user has already burned a key for a given event
    // mapping(bytes32 => bool) private _eventUserOpa;
    mapping(uint256 => OriginalKey) private _originalKeys;

    IReadOutwave _outwave;
    IUnlock _unlock;

    event KeyBurn(address indexed from, address indexed lock, uint256 tokenId);

    struct OriginalKey {
        uint256 keyId;
        address lockAddress;
        string tokenURI;
        bytes32 eventId;
    }

    constructor(address outwaveAddr, address unlockAddr)
        ERC721("OutwavePartecipantAttestation", "OPA")
    {
        _outwave = IReadOutwave(outwaveAddr);
        _unlock = IUnlock(unlockAddr);
    }

    // Returns the json file of the corresponding token ID.
    // Used for getting things like the NFT's name, properties, description etc.
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "TOKENID_NOT_EXISTS");
        assert(_originalKeys[tokenId].keyId != 0);
        return _originalKeys[tokenId].tokenURI;
    }

    function setTokenURI(uint256 tokenId, string memory tokenUri)
        external
        onlyOwner
    {
        assert(_originalKeys[tokenId].keyId != 0);
        _originalKeys[tokenId].tokenURI = tokenUri;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Burn the key of an Outwave Lock
     * @param parent The address of the parent PublicLock
     * @param tokenId The id of the PublickLock key to be burned
     */
    function burnKey(address parent, uint256 tokenId) external {
        (bool deployed, , ) = _unlock.locks(parent);
        IPublicLock parentLock = IPublicLock(parent);
        require(
            deployed && parentLock.isOwner(address(_outwave)),
            "NOT_PUBLIC_LOCK"
        );

        parentLock.burn(tokenId);

        // mint the replacing token
        uint256 mintedTokenId = _mint(msg.sender);

        // compose new tokenUri
        string memory lockBaseURI = _subString(
            parentLock.tokenURI(tokenId),
            0,
            54
        );

        // store tokenUri
        _originalKeys[mintedTokenId] = OriginalKey(
            tokenId,
            parent,
            string(
                abi.encodePacked(
                    lockBaseURI,
                    Strings.toString(tokenId),
                    "_mk.json"
                )
            ),
            _outwave.getEventByLock(parent)
        );

        emit KeyBurn(msg.sender, parent, tokenId);
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

    function _mint(address to) private returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _subString(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }
}
