var UniswapV2Pair = artifacts.require("./UniswapV2Pair");
var MovementToken = artifacts.require("./MovementToken");
var MVTUniswapMining = artifacts.require("./MVTUniswapMining");
var MVTUniswapMiningProxy = artifacts.require("./MVTUniswapMiningProxy");

module.exports = async function(deployer) {
    await deployer.deploy(UniswapV2Pair);
    await deployer.deploy(MovementToken);

    await deployer.deploy(MVTUniswapMining);
    await deployer.deploy(MVTUniswapMiningProxy, MVTUniswapMining.address);

    MVTUniswapMining.at(MVTUniswapMiningProxy.address);
    miningInstance = await MVTUniswapMining.deployed();

    await miningInstance.initiate(0, 200, "1150000000000000000", MovementToken.address, UniswapV2Pair.address);
    
}
