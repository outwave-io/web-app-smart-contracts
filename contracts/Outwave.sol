// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Organization.sol";
import "./EventLog.sol";


// shall have the owner
contract Outwave is EventLog, Ownable {

    // we need a struct to instaciate new contracts.
    // this needs to be handled differntly from c# 
    struct S_Organization{
        Organization Org;
        // easies and low gas ways to handle if istance have been created
        bool Exsists;
    }

    mapping(address => S_Organization) public _organizations;

    function createOrganization() public {
        console.log("[createOrg] msg.sender is '%s'", msg.sender);
        require(!_organizations[msg.sender].Exsists, "cannot create multiple organizations");
        Organization org = new Organization(this, msg.sender);
        _organizations[msg.sender].Org = org;
        _organizations[msg.sender].Exsists = true;
        console.log("[createOrg] New organization '%s' created for user '%s'", address(org), msg.sender);
    }


    function organizationAddress() public view returns(address){
        require(_organizations[msg.sender].Exsists, "No organization for your address");
        return address(_organizations[msg.sender].Org);
    }

}