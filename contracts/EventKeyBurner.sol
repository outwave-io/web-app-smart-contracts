// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
// import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
// import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {IUnlockV11 as IUnlock} from "@unlock-protocol/contracts/dist/Unlock/IUnlockV11.sol";
import {IPublicLockV10 as IPublicLock} from "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";
import "./interfaces/IReadOutwave.sol";

/**
 * @title OutwaveKeyBurner
 * @author Raffaele Brivio (demind.io)
 * @notice Burns Unlock Keys coming from Outwave ecosystem, giving back a freshly minted NFT.
 **/
contract EventKeyBurner is ERC721Upgradeable, ERC721HolderUpgradeable, ERC721EnumerableUpgradeable, Ownable {
    using Counters for Counters.Counter;
    using AddressUpgradeable for address;

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

    function initialize(address outwaveAddr, address unlockAddr) public
    {
        super.__ERC721_init("OutwavePartecipantAttestation", "OPA");
        _outwave = IReadOutwave(outwaveAddr);
        _unlock = IUnlock(unlockAddr);
    }

    // constructor(address outwaveAddr, address unlockAddr) 
    //     ERC721("OutwavePartecipantAttestation", "OPA")
    // {
    //     _outwave = IReadOutwave(outwaveAddr);
    //     _unlock = IUnlock(unlockAddr);
    // }

    function _approve(address to, uint256 tokenId) internal override(ERC721Upgradeable)
    {
        super._approve(to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable)
    {
        super._burn(tokenId);
    }

    function _exists(uint256 tokenId) internal override(ERC721Upgradeable) view returns (bool) {
        return super._exists(tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal override(ERC721Upgradeable) view returns (bool)
    {
        return super._isApprovedOrOwner(spender, tokenId);
    }

    function _mint(address to, uint256 tokenId) internal override(ERC721Upgradeable)
    {
        super._mint(to, tokenId);
    }

    function _msgSender() internal view override(Context, ContextUpgradeable) returns (address) {
        return super._msgSender();
    }

    function _msgData() internal view override(Context, ContextUpgradeable) returns (bytes calldata) {
        return super._msgData();
    }

    function _safeMint(address to, uint256 tokenId) internal override(ERC721Upgradeable)
    {
        super._safeMint(to, tokenId);
    }

    function _safeMint(address to, uint256 tokenId, bytes memory _data) internal override(ERC721Upgradeable)
    {
        super._safeMint(to, tokenId, _data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal override(ERC721Upgradeable)
    {
        super._safeTransfer(from, to, tokenId, _data);
    } 

    function _setApprovalForAll(address owner, address operator, bool approved) internal override(ERC721Upgradeable)
    {
        super._setApprovalForAll(owner, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super.transferFrom(from, to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal override(ERC721Upgradeable)
    {
        super._transfer(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) public override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super.approve(to, tokenId);
    }

    function balanceOf(address owner) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (uint256)
    {
        return super.balanceOf(owner);
    }

    function getApproved(uint256 tokenId) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (address)
    {
        return super.getApproved(tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool)
    {
        return super.isApprovedForAll(owner, operator);
    }

    function name() public view override (ERC721Upgradeable) returns (string memory)
    {
        return super.name();
    }

    function symbol() public view override (ERC721Upgradeable) returns (string memory)
    {
        return super.symbol();
    }    

    function ownerOf(uint256 tokenId) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (address)
    {
        return super.ownerOf(tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override(ERC721Upgradeable, ERC721EnumerableUpgradeable) 
    {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to,  uint256 tokenId, bytes memory _data) public override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super.safeTransferFrom(from, to, tokenId, _data);
    }

    function setApprovalForAll(address operator, bool approved) public override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super.setApprovalForAll(operator, approved);
    }

    // function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private override(ERC721Upgradeable) returns (bool)
    // {
    //     if (to.isContract()) {
    //         try IERC721ReceiverUpgradeable(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
    //             return retval == IERC721ReceiverUpgradeable.onERC721Received.selector;
    //         } catch (bytes memory reason) {
    //             if (reason.length == 0) {
    //                 revert("ERC721: transfer to non ERC721Receiver implementer");
    //             } else {
    //                 assembly {
    //                     revert(add(32, reason), mload(reason))
    //                 }
    //             }
    //         }
    //     } else {
    //         return true;
    //     }
    // }

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
    ) public pure override(ERC721HolderUpgradeable, IERC721ReceiverUpgradeable) returns (bytes4) {
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

    function _baseURI() internal pure override(ERC721Upgradeable) returns (string memory) {
        revert("FEATURE_DISABLED");
    }

    function _mintToken(address to) private returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }
}
