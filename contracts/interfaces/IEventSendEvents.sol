// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.17 <0.9.0;

// interface that stores centrally all events emmited by OutwaveEvents. Specifically implemented in EventCoreMixin
interface IEventSendEvents {

    // EVENTS
    /**
        @notice  emitted when a new event is create
    **/
    event EventCreated(
         address indexed owner,
         bytes32 eventId
    );

    /**
       @notice emitted when a new event is create
    **/
    event EventDisabled(
         address indexed owner,
         bytes32 eventId
    );

    /**
      @notice emitted when a new lock is registered internally in the OutwaveEvents. Locks are registered in the mapping between
     user wallets and lockadress to store ownerships  
    **/
    event LockRegistered(
        address indexed owner,
        bytes32 indexed eventId,
        address indexed lockAddress,
        bytes32 lockId
    );

    /** 
        @notice emitted when a lock is updated 
    **/
    event LockUpdated(
        address indexed lockAddress
    );

    /** 
        @notice emitted when a lock is removed from mapping. see  LockRegistered for more info
    **/
    event LockDeregistered(
        address indexed owner,
        bytes32 indexed eventId,
        address indexed lockAddress,
        bytes32 lockId
    );

    /** 
        @notice emitted when a payment is received to outwave manager
    **/
    event PaymentReceived(address, uint);

     /** 
        @notice emmited when an organization withdraws from a lock
    **/
    event OutwaveWithdraw(address beneficiaryAddr, address tokenAddr, uint amount);

    /** 
        @notice emitted when organization has withdrawed and outwave dao receives fee
    **/
    event OutwavePaymentTransfered(address from, uint amount);

}
