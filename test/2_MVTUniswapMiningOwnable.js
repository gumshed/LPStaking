
const truffleAssert = require('truffle-assertions');

const MVTUniswapMining = artifacts.require('MVTUniswapMining');
const MovementToken = artifacts.require('MovementToken');

contract('MVTUniswapMining', (accounts) => {
    it('should be pausable by admin', async () => {
        miningInstance = await MVTUniswapMining.deployed();
    
        await miningInstance.pause({from: accounts[0]});

        var isPaused = await miningInstance.paused();

        assert.equal(isPaused, true, 'contract is not paused');
        
    });

    it('should be unpausable by admin', async () => {
        miningInstance = await MVTUniswapMining.deployed();
    
        await miningInstance.unpause({from: accounts[0]});

        var isPaused = await miningInstance.paused();

        assert.equal(isPaused, false, 'contract is still paused');
        
    });

    it('should be able to sendMVT by admin', async () => {
        miningInstance = await MVTUniswapMining.deployed();
        mvtInstance = await MovementToken.deployed();
    
        await mvtInstance.mint(MVTUniswapMining.address, 1234567890, {from: accounts[0]})
        await miningInstance.sendMVT(accounts[0], 1234567890, {from: accounts[0]});
        balance = await mvtInstance.balanceOf(MVTUniswapMining.address);

        assert.equal(balance, 0, 'MVT balance is different');
        
    });

    it('should revert pause if caller is not the owner', async () => {
        miningInstance = await MVTUniswapMining.deployed();

        await truffleAssert.reverts(miningInstance.pause({from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    it('should revert unpause if caller is not the owner', async () => {
        miningInstance = await MVTUniswapMining.deployed();

        await truffleAssert.reverts(miningInstance.unpause({from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    it('should revert sendMVT if caller is not the owner', async () => {
        miningInstance = await MVTUniswapMining.deployed();

        await truffleAssert.reverts(miningInstance.sendMVT(accounts[1], 1, {from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    

    

});