
const truffleAssert = require('truffle-assertions');

const MVTUniswapMining = artifacts.require('MVTUniswapMining');

contract('MVTUniswapMining', (accounts) => {

    it('should revert all public functions if it is paused', async () => {
        miningInstance = await MVTUniswapMining.deployed();

        await miningInstance.pause({from: accounts[0]});

        await truffleAssert.reverts(miningInstance.stake(1, 0, {from: accounts[0]}), "Pausable: paused");
        await truffleAssert.reverts(miningInstance.unstake(0, {from: accounts[0]}), "Pausable: paused");
        await truffleAssert.reverts(miningInstance.claimMVT({from: accounts[0]}), "Pausable: paused");
        
    });

    

    

});