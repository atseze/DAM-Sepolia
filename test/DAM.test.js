const { ethers } = require("hardhat");
const { expect } = require("chai");
require("dotenv").config();

const sharePercent = 50;
const asset1Name = "Asset Name";
const asset1Price = ethers.utils.parseEther("0.02");
let asset1Index;
let marketCount;

// This part of code (which is commented now) is for testing deploy of contract on alchemy sepolia test net
/*
describe("Checking market initial state", async () => {
  let myMarket, provider;

  before(async () => {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.ALCHEMY_API_NETWORK
    );

    myMarket = await ethers.getContractAt(
      "DigitalAssetMarket",
      process.env.MARKET_ADDRESS
    );
  });

  it("Check share percent", async () => {
    expect(
      await myMarket.connect(process.env.OWNER_ADDRESS).sharePercent()
    ).to.be.equal(sharePercent);
  });

  it("Check that market is empty", async () => {
    expect(
      await myMarket.connect(process.env.OWNER_ADDRESS).assetsCount()
    ).to.be.equal(0);
  });

  it("Check that market balance is zero", async () => {
    expect(await provider.getBalance(process.env.MARKET_ADDRESS)).to.be.equal(
      0
    );
  });
});
*/
describe("Checking market business", () => {
  let myMarket, owner, seller, buyer, provider;
  let sellerWallet;

  before(async () => {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.ALCHEMY_API_NETWORK
    );

    myMarket = await ethers.getContractAt(
      "DigitalAssetMarket",
      process.env.MARKET_ADDRESS
    );

    owner = process.env.OWNER_ADDRESS;
    ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
    sellerWallet = new ethers.Wallet(process.env.SELLER_PRIVATE_KEY, provider);
    seller = await ethers.getSigner(process.env.SELLER_ADDRESS);
    buyer = await ethers.getSigner(process.env.BUYER_ADDRESS);
    buyerWallet = new ethers.Wallet(process.env.BUYER_PRIVATE_KEY, provider);
    marketCount = Number(await myMarket.assetsCount());
  });

  it("Seller add asset to market", async () => {
    const txResponse = await myMarket
      .connect(sellerWallet)
      .addAsset(asset1Name, asset1Price, { gasLimit: 0x999999 });
    txReceipt = await txResponse.wait();
    asset1Index = Number(await myMarket.assetsCount()) - 1;
  });

  it("Asset must added to market", async () => {
    expect(await myMarket.assetsCount()).equal(marketCount + 1);
    const asset1 = await myMarket.assetData(Number(asset1Index));
    expect(asset1[0]).to.be.equal(asset1Name);
    expect(asset1[1]).to.be.equal(asset1Price);
    expect(asset1[2]).to.be.equal(0);
  });

  it("Unathorized access to assets data are prohabitted", async () => {
    expect(
      myMarket.connect(sellerWallet).assetData(asset1Index)
    ).to.be.revertedWith("Only market owner can call this method!");
  });

  it("Buyer can noy buy asset with incorrect value", async () => {
    (
      await expect(
        myMarket.connect(buyerWallet).buy(asset1Index, {
          value: ethers.utils.parseEther("0.0001"),
        })
      )
    ).to.be.revertedWith("Value and price are different!");
  });

  it("Buyer can not buy a product with an invalid index", async () => {
    (
      await expect(
        myMarket.connect(buyerWallet).buy(100, {
          value: asset1Price,
        })
      )
    ).to.be.revertedWith("The asset reference is not valid!");
  });

  it("Buyer can buy asset with correct value", async () => {
    const buyerStartingBalance = await provider.getBalance(
      process.env.BUYER_ADDRESS
    );
    const sellerStartingBalance = await provider.getBalance(
      process.env.SELLER_ADDRESS
    );

    const txResponse = await myMarket.connect(buyerWallet).buy(asset1Index, {
      value: asset1Price,
      gasLimit: 0x999999,
    });
    const txReceipt = await txResponse.wait();
    console.log("Transaction Receipt", txReceipt);
    const buyerChangedBalance = await provider.getBalance(
      process.env.BUYER_ADDRESS
    );

    expect(buyerChangedBalance).to.be.equal(
      BigInt(buyerStartingBalance) -
        BigInt(txReceipt.gasUsed) * BigInt(txReceipt.effectiveGasPrice) -
        BigInt(asset1Price)
    );
    expect(await provider.getBalance(process.env.MARKET_ADDRESS)).to.be.equal(
      (BigInt(asset1Price) * BigInt(sharePercent)) / BigInt(100)
    );
    expect(await provider.getBalance(process.env.SELLER_ADDRESS)).to.be.equal(
      BigInt(sellerStartingBalance) +
        (BigInt(asset1Price) * BigInt(100 - sharePercent)) / BigInt(100)
    );
  });

  it("Seller and buyer must be different", async () => {
    (
      await expect(
        myMarket.connect(sellerWallet).buy(asset1Index, {
          value: asset1Price,
        })
      )
    ).to.be.revertedWith("This item is yours!");
  });

  it("An item cannot be sold twice", async () => {
    expect(
      myMarket.connect(buyerWallet).buy(asset1Index, {
        value: asset1Price,
      })
    ).to.be.revertedWith("This item is not for sale!");
  });

  it("Only market owner can withdraw money", async () => {
    expect(
      myMarket.connect(sellerWallet).withdraw(ethers.utils.parseEther("0.01"))
    ).to.be.revertedWith("Only market owner can withdraw money!");
  });

  it("Withdrawn amount must be gt 0 and lte market balance", async () => {
    expect(myMarket.withdraw(asset1Price)).to.be.revertedWith(
      "Not acceptable money value!"
    );
  });

  it("Owner can withdraw market balance", async () => {
    const ownerStartingBalance = await provider.getBalance(
      process.env.OWNER_ADDRESS
    );
    const marketStartingBalance = await provider.getBalance(
      process.env.MARKET_ADDRESS
    );

    const txResponse = await myMarket.withdraw(
      (BigInt(asset1Price) * BigInt(100 - sharePercent)) / BigInt(100),
      { gasLimit: 0x999999 }
    );
    const txReceipt = await txResponse.wait();
    const ownerNewBalance = await provider.getBalance(
      process.env.OWNER_ADDRESS
    );
    expect(ownerNewBalance).to.be.equal(
      BigInt(ownerStartingBalance) +
        BigInt(marketStartingBalance) -
        BigInt(txReceipt.gasUsed) * BigInt(txReceipt.effectiveGasPrice)
    );
  });
});
