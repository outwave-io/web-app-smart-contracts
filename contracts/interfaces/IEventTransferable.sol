// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.17 <0.9.0;

interface IEventTransferable {

    function eventLockRegister(
        address ownerAddress,
        bytes32 eventId,
        address entityAdresses,
        bytes32 lockId
     ) external;

    function eventLockDeregister(
        address ownerAddress,
        bytes32 eventId,
        address entityAddress
    ) external; 
}