// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.17 <0.9.0;

interface IReadOutwave {
    function eventByLock(address lockAddress, address ownerAddress)
        external
        view
        returns (bytes32 eventId);

    function eventOwner(bytes32 eventId) external view returns (address owner);
}
