// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Outwave factory
 * @author Miro Radenovic (demind.io)
 * @dev ERC165 allows our contract to be queried to determine whether it implements a given interface.
 * Every ERC-721 compliant contract must implement the ERC165 interface.
 * https://eips.ethereum.org/EIPS/eip-721
 */


 
/*
Todo
- shall be upgradable, to add new implementations. this smart contract will allow us to implement features like staking
- register all withdraws, to know how much hase been earned
*/

contract OutwaveOrganization is Ownable
{
    bytes32 private _ipfsdata;

    constructor(bytes32 ipfsdata){
        _ipfsdata = ipfsdata;
    }

    // refuisters all withdraws from the organization. allows us to know how much have been gained by each wit
    function registerWithdraw(address lockAddr, uint amount) public {

    }

}
