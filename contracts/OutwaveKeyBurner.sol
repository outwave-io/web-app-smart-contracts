// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {IUnlockV11 as IUnlock} from "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";
import "./interfaces/IReadOutwave.sol";

contract OutwaveKeyBurner is ERC721Holder, ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private tokenIdCounter;

    bytes4 constant ERC721ID = 0x80ac58cd;

    IReadOutwave outwave;
    IUnlock unlock;

    struct OriginalKey {
        uint256 keyId;
        address lockAddress;
        string tokenURI;
        bytes32 eventId;
    }

    mapping(uint256 => OriginalKey) private originalKeys;

    event KeyBurn(address indexed from, address indexed lock, uint256 tokenId);

    constructor(address _outwave, address _unlock)
        ERC721("OutwavePartecipantAttestation", "OPA")
    {
        outwave = IReadOutwave(_outwave);
        unlock = IUnlock(_unlock);
    }

    function _baseURI() internal pure override returns (string memory) {
        revert("FEATURE_DISABLED");
    }

    // Returns the json file of the corresponding token ID.
    // Used for getting things like the NFT's name, properties, description etc.
    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "TOKENID_NOT_EXISTS");
        assert(originalKeys[_tokenId].keyId != 0);
        return originalKeys[_tokenId].tokenURI;
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenUri)
        external
        onlyOwner
    {
        assert(originalKeys[_tokenId].keyId != 0);
        originalKeys[_tokenId].tokenURI = _tokenUri;
    }

    function burnKey(address _parent, uint256 _tokenId) public {
        (bool isLock, , ) = unlock.locks(_parent);
        require(isLock, "NOT_PUBLIC_LOCK");

        IPublicLock parentLock = IPublicLock(_parent);
        parentLock.burn(_tokenId);

        // mint the replacing token
        uint256 mintedTokenId = _mint(msg.sender);

        // compose new tokenUri
        string memory lockBaseURI = subString(
            parentLock.tokenURI(_tokenId),
            0,
            54
        );

        // store tokenUri
        originalKeys[mintedTokenId] = OriginalKey(
            _tokenId,
            _parent,
            string(
                abi.encodePacked(
                    lockBaseURI,
                    Strings.toString(_tokenId),
                    "_mk.json"
                )
            ),
            outwave.getEventByLock(_parent)
        );

        emit KeyBurn(msg.sender, _parent, _tokenId);
    }

    function _mint(address _to) private returns (uint256) {
        uint256 tokenId = tokenIdCounter.current();
        tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        return tokenId;
    }

    function readUnlock() external view returns (address) {
        return address(unlock);
    }

    function readOutwave() external view returns (address) {
        return address(outwave);
    }

    function readOriginalKey(uint256 _tokenId)
        public
        view
        returns (OriginalKey memory originalKey)
    {
        require(_exists(_tokenId), "TOKENID_NOT_EXISTS");
        return originalKeys[_tokenId];
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function subString(
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
