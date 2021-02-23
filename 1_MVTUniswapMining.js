var LPTokenTest = artifacts.require("./LPTokenTest");
var MVTTokenTest = artifacts.require("./MVTTokenTest");
var MVTUniswapMining = artifacts.require("./MVTUniswapMining");
var MVTUniswapMiningProxy = artifacts.require("./MVTUniswapMiningProxy");

module.exports = async function(deployer) {
    await deployer.deploy(LPTokenTest);
    await deployer.deploy(MVTTokenTest);

    await deployer.deploy(MVTUniswapMining);
    await deployer.deploy(MVTUniswapMiningProxy, MVTUniswapMining.address);

    MVTUniswapMining.at(MVTUniswapMiningProxy.address);
    miningInstance = await MVTUniswapMining.deployed();

    await miningInstance.initiate(0, 200, "1150000000000000000", MVTTokenTest.address, LPTokenTest.address);
    
}
