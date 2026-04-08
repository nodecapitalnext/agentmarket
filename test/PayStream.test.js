const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { ethers } = hre;

describe("PayStream", function () {
  let paystream, usdc;
  let owner, subscriber, recipient;

  const AMOUNT = ethers.parseUnits("10", 6); // 10 USDC
  const INTERVAL = 30 * 24 * 60 * 60; // 30 gün

  beforeEach(async () => {
    [owner, subscriber, recipient] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    usdc = await ERC20Mock.deploy("USD Coin", "USDC", 6);

    await usdc.mint(subscriber.address, ethers.parseUnits("1000", 6));

    const PayStream = await ethers.getContractFactory("PayStream");
    paystream = await PayStream.deploy(await usdc.getAddress());

    await usdc.connect(subscriber).approve(
      await paystream.getAddress(),
      ethers.MaxUint256
    );
  });

  it("Abonelik oluşturulabilmeli", async () => {
    await paystream.connect(subscriber).createSubscription(
      recipient.address, AMOUNT, INTERVAL, false
    );
    const sub = await paystream.subscriptions(0);
    expect(sub.active).to.be.true;
    expect(sub.amount).to.equal(AMOUNT);
  });

  it("Ödeme zamanı gelince çalışmalı", async () => {
    await paystream.connect(subscriber).createSubscription(
      recipient.address, AMOUNT, INTERVAL, false
    );

    await time.increase(INTERVAL);

    const balanceBefore = await usdc.balanceOf(recipient.address);
    await paystream.executePayment(0);
    const balanceAfter = await usdc.balanceOf(recipient.address);

    const fee = (AMOUNT * 50n) / 10000n;
    expect(balanceAfter - balanceBefore).to.equal(AMOUNT - fee);
  });

  it("Erken ödeme yapılamamalı", async () => {
    await paystream.connect(subscriber).createSubscription(
      recipient.address, AMOUNT, INTERVAL, false
    );
    await expect(paystream.executePayment(0)).to.be.revertedWith(
      "Henuz odeme zamani gelmedi"
    );
  });

  it("Abonelik iptal edilebilmeli", async () => {
    await paystream.connect(subscriber).createSubscription(
      recipient.address, AMOUNT, INTERVAL, false
    );
    await paystream.connect(subscriber).cancelSubscription(0);
    const sub = await paystream.subscriptions(0);
    expect(sub.active).to.be.false;
  });

  it("startNow ile ilk ödeme anında yapılmalı", async () => {
    const balanceBefore = await usdc.balanceOf(recipient.address);
    await paystream.connect(subscriber).createSubscription(
      recipient.address, AMOUNT, INTERVAL, true
    );
    const balanceAfter = await usdc.balanceOf(recipient.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });
});
