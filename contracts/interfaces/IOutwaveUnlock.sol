// SPDX-License-Identifier: UNLICENSED
// !! THIS FILE WAS AUTOGENERATED BY abi-to-sol v0.6.6. SEE SOURCE BELOW. !!
pragma solidity ^0.8.4;

interface IOutwaveUnlock {
    event Initialized(uint8 version);
    event NewLock(address indexed lockOwner, address indexed newLockAddress);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event Paused(address account);
    event Unpaused(address account);

    function createLock(
        uint256 _expirationDuration,
        address _tokenAddress,
        uint256 _keyPrice,
        uint256 _maxNumberOfKeys,
        string memory _lockName,
        bytes12
    ) external returns (address);

    function initialize() external;

    function locks(address)
        external
        view
        returns (
            bool deployed,
            uint256 totalSales,
            uint256 yieldedDiscountTokens
        );

    function owner() external view returns (address);

    function pause() external;

    function paused() external view returns (bool);

    function renounceOwnership() external;

    function transferOwnership(address newOwner) external;

    function unpause() external;
}

// THIS FILE WAS AUTOGENERATED FROM THE FOLLOWING ABI JSON:
/*
[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"lockOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newLockAddress","type":"address"}],"name":"NewLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[{"internalType":"uint256","name":"_expirationDuration","type":"uint256"},{"internalType":"address","name":"_tokenAddress","type":"address"},{"internalType":"uint256","name":"_keyPrice","type":"uint256"},{"internalType":"uint256","name":"_maxNumberOfKeys","type":"uint256"},{"internalType":"string","name":"_lockName","type":"string"},{"internalType":"bytes12","name":"","type":"bytes12"}],"name":"createLock","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"locks","outputs":[{"internalType":"bool","name":"deployed","type":"bool"},{"internalType":"uint256","name":"totalSales","type":"uint256"},{"internalType":"uint256","name":"yieldedDiscountTokens","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"}]
*/
