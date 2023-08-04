const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("MyDAM");
  const contract = await Contract.deploy(50);

  await contract.deployed();

  console.log("DAM deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
