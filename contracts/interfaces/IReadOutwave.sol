// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

interface IReadOutwave {
    function getEventByLock(address lockAddress)
        external
        view
        returns (bytes32 eventId);
}
