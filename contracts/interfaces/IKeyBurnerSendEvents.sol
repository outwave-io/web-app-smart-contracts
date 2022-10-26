// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.17 <0.9.0;

// interface that stores centrally all events emmited by KeyBurner
interface IKeyBurnerSendEvents {
    /**
        @notice emitted when a Public Lock's key is burnt
    **/
    event KeyBurn(
        address indexed from,
        address indexed lock,
        uint256 burnedTokenId,
        uint256 newTokenId
    );
}
