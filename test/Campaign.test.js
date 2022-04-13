const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts;
let factory;
let campaign;
let campaignAddress;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({
      from: accounts[0],
      gas: "1000000",
    });

  await factory.methods.createCampaign("100").send({
    from: accounts[0],
    gas: "1000000",
  });

  const addresses = await factory.methods.getDeployedCampaigns().call();
  campaignAddress = addresses[0];

  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
});

describe("Campaigns", () => {
  it("deploys a factory and campaign", () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  it("marks the caller as manager of the campaign", async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });

  it("allows people to send money to become an approver", async () => {
    await campaign.methods.contribute().send({
      value: "200",
      from: accounts[1],
    });
    const isContributer = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributer);
  });

  it("requires a minimum contribution", async () => {
    try {
      await campaign.methods.contribute.send({
        value: "50",
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("allows manager to create a request", async () => {
    await campaign.methods
      .createRequest("Buy batteries", "100", accounts[2])
      .send({ from: accounts[0], gas: "1000000" });

    const request = await campaign.methods.requests(0).call();
    assert.equal("Buy batteries", request.description);
  });

  it("allows manager to finalize a request", async () => {
    await campaign.methods.contribute().send({
      value: web3.utils.toWei("3", "ether"),
      from: accounts[1],
      gas: "1000000",
    });

    await campaign.methods.contribute().send({
      value: web3.utils.toWei("3", "ether"),
      from: accounts[0],
      gas: "1000000",
    });

    console.log("contributed by 1 and 2");

    await campaign.methods
      .createRequest(
        "Buy batteries",
        web3.utils.toWei("3", "ether"),
        accounts[2]
      )
      .send({ from: accounts[0], gas: "1000000" });

    console.log("request created");

    await campaign.methods.approveRequest(0).send({
      from: accounts[1],
      gas: "1000000",
    });

    console.log("request approved");

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: "1000000",
    });

    console.log("request approved by person 2");

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "1000000",
    });

    console.log("request finalized");

    let balance = await web3.eth.getBalance(accounts[2]);
    balance = web3.utils.fromWei(balance, "ether");
    balance = parseFloat(balance);
    console.log(balance);

    assert(balance > 102);
  });
});
