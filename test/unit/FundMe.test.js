const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains?.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          // const sendValue = 1e18;
          const sendValue = ethers.utils.parseEther("1"); // 1eth
          beforeEach(async () => {
              // alternative: const accounts = await ethers.getSigners(); const accountZero = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async () => {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });
          describe("fund", async () => {
              it("fails if not enough fee", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "didn't send enough"
                  );
              });
              it("updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  // 返回的是一个bigNumber
                  assert.equal(response.toString(), sendValue.toString());
              });
              it("adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunders(0);
                  assert.equal(funder, deployer);
              });
          });
          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });
              it("allows us to withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; ++i) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionResponse = await fundMe.withdraw();
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      );
                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);
                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);
                      // Assert
                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );

                      // Make sure that funders are reset properly
                      await expect(fundMe.getFunders(0)).to.be.reverted;

                      for (let i = 1; i < 6; ++i) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          );
                      }
                  }
              });
              it("cheaperWithdraw testing ", async function () {
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; ++i) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionResponse =
                          await fundMe.cheaperWithdraw();
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      );
                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);
                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);
                      // Assert
                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );

                      // Make sure that funders are reset properly
                      await expect(fundMe.getFunders(0)).to.be.reverted;

                      for (let i = 1; i < 6; ++i) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          );
                      }
                  }
              });
              it("only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attackerContract = await fundMe.connect(accounts[1]);
                  await expect(
                      attackerContract.withdraw()
                  ).to.be.revertedWithCustomError(
                      attackerContract,
                      "FundMe__NotOwner"
                  );
              });
          });
      });
