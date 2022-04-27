// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Organization.sol";

contract Event is Ownable{

    Organization _org;
    string _name;
    uint _date;


    constructor(Organization organization, address owner, string memory name, uint date) {
        _org = organization;
        _name = name;
        _date = date; 
        _transferOwnership(owner);
        console.log("Event %s created by %s", name , msg.sender);
    }

    function updateName(string memory name) public onlyOwner{
        _name = name;
    }

    function details() public view returns(string memory, uint){
        return (_name, _date);
    }

}