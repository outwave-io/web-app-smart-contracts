// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract EventLog{

    enum ContractType {
        Organization,
        Event
    }

   event ContractCreated(address indexed ownerAddr, address contractAddr, ContractType contractType); 
}