require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploy eden:", deployer.address);

  const USDC_ADDRESS = process.env.USDC_ADDRESS;
  if (!USDC_ADDRESS || USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("USDC_ADDRESS .env dosyasında tanımlı değil!");
  }

  const PayStream = await hre.ethers.getContractFactory("PayStream");
  const paystream = await PayStream.deploy(USDC_ADDRESS);
  await paystream.waitForDeployment();

  const address = await paystream.getAddress();
  console.log("PayStream deploy edildi:", address);
  console.log("USDC adresi:", USDC_ADDRESS);
  console.log("ArcScan:", `https://testnet.arcscan.app/address/${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
