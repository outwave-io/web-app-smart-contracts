const { expect } = require("chai");
const { EventFragment } = require("ethers/lib/utils");
const { ethers } = require("hardhat");



describe("Outwave.io", function () {

  let Outwave;
  let outwave;
  let owner;
  let addr1;

  beforeEach(async function(){

    [owner, addr1] = await ethers.getSigners();    
    Outwave = await ethers.getContractFactory("Outwave");
    outwave = await Outwave.deploy();
    await outwave.deployed();
  });


  describe("Create Organization and childs", function () { 
    let orgContract;
    let eventContract;

    it("Prints some infos for debugging", async function () { 
      console.log("outwave addr: " + outwave.address);
      console.log("owner addr: " + owner.address);
      console.log("addr1 addr: " + addr1.address);
    });

    it("Should create organization and interact...", async function () {
    
      const createOrganizationTx = await outwave.createOrganization();
      await createOrganizationTx.wait();
  
      const organizationAdress = await outwave.organizationAddress();
      const add = await outwave._organizations(owner.address);
      expect(organizationAdress, "organization address").to.equal(add.Org);

      const Organization = await ethers.getContractFactory("Organization");
      orgContract = await Organization.attach(
        add.Org // The deployed contract address
      );

      const eventAddress = await orgContract.eventsAdresses();
      expect(eventAddress.length, "events ").to.equal(0);
     
    });

    it("...Should create event and interact ", async function () {
      const createEventTx = await orgContract.createEvent("event1", 3223);
      await createEventTx.wait();

      const eventAddress = await orgContract.eventAddress(0);

      const Event = await ethers.getContractFactory("Event");
      eventContract = await Event.attach(
        eventAddress // the deployed event contract
      );

      let details = await eventContract.details();

      expect(details[0]).to.equal("event1");
      expect(details[1]).to.equal(3223);
    });

  });
  /*

  it("Should create organization and return correct address", async function () {

    const createOrganizationTx = await outwave.createOrganization();
    await createOrganizationTx.wait();

    const organizationAdress = await outwave.organizationAddress();
    const add = await outwave._organizations(owner.address);
    expect(organizationAdress).to.equal(add.Org);
    
  });

  it("Should interact with Organization contract", async function () {

    const createOrganizationTx = await outwave.createOrganization();
    await createOrganizationTx.wait();
    const organizationAdress = await outwave.organizationAddress();

    const Organization = await ethers.getContractFactory("Organization");
    const organization = await Organization.attach(
      organizationAdress // The deployed contract address
    );

    const organizationOwner = await organization.Owner();
    expect(organizationOwner).to.equal(owner.address);
    
  });

  // todo: should not copy pas previus steps: use sequence
  it("Should interact with Event contract", async function () {

    const createOrganizationTx = await outwave.createOrganization();
    await createOrganizationTx.wait();
    const organizationAdress = await outwave.organizationAddress();

    const Organization = await ethers.getContractFactory("Organization");
    const organization = await Organization.attach(
      organizationAdress // The deployed contract address
    );

    const organizationOwner = await organization.createEvent
   
    
  });

  */

  
});
