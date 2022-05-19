// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

interface IReadOutwave {
    function isOutwaveLock(address _lockAddress)
        external
        view
        returns (bool isIndeed);

    function getEventByLock(address _lockAddress)
        external
        view
        returns (bytes32 eventId);
}
