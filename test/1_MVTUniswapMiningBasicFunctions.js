var BN = web3.utils.BN;

const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const MovementToken = artifacts.require('MovementToken');
const MVTUniswapMining = artifacts.require('MVTUniswapMining');

var movementTokenInstance;
var uniswapV2PairInstance;

contract('MVTUniswapMining', (accounts) => {


    it('should mint 1000000 MVT to Mining Contract', async () => {
        movementTokenInstance = await MovementToken.deployed();

        //block 1
        await movementTokenInstance.mint(MVTUniswapMining.address, "100000000000000000000000000", { from: accounts[0] });

        const balance = await movementTokenInstance.balanceOf(MVTUniswapMining.address);
        assert.equal(balance, "100000000000000000000000000", 'The balance is not 1000000 MVT');
    });

    it('should mint 100000 LP Token to the first account', async () => {
        uniswapV2PairInstance = await UniswapV2Pair.deployed();

        //block 2
        await uniswapV2PairInstance.mint(accounts[0], "10000000000000000000000000", { from: accounts[0] });

        const balance = await uniswapV2PairInstance.balanceOf(accounts[0]);
        assert.equal(balance, "10000000000000000000000000", 'The balance is not 100000 LP Token');
    });

    it('should approve 5000000 LP Token to Mining address', async () => {
        uniswapV2PairInstance = await UniswapV2Pair.deployed();

        //block 3
        await uniswapV2PairInstance.approve(MVTUniswapMining.address, "500000000000000000000000000", { from: accounts[0] });

        const allowance = await uniswapV2PairInstance.allowance(accounts[0], MVTUniswapMining.address);
        assert.equal(allowance, "500000000000000000000000000", 'The allowance is not 5000000 LP Token');
    });

    it('should stake 1000 LP Token', async () => {

        miningInstance = await MVTUniswapMining.deployed();
        
        //block 4
        await miningInstance.stake("1000000000000000000000", 0, { from: accounts[0] });

        const stake = await miningInstance.stakeHolders(accounts[0]);
        assert.equal(stake, "1000000000000000000000", 'The stake is not 1000 LP Token');

    });

    //after 5 blocks should claim 5*1.15 MVT
    it('should claim 5.75 MVT', async () =>{
        miningInstance = await MVTUniswapMining.deployed();

        //block 5
        await miningInstance.claimMVT({ from: accounts[0] });
        balance = await movementTokenInstance.balanceOf(accounts[0]);
        assert.equal(balance.toString(), "5750000000000000000", 'Didnt claim 5.75 LP Token');
    });

    it('should claim 115 MVT after 100 blocks', async () =>{

        miningInstance = await MVTUniswapMining.deployed();
        
        //block 6
        await uniswapV2PairInstance.mint(accounts[1], "10000000000000000000000000", { from: accounts[0] });

        for(i=0; i<93; i++){ //block 7-99
            await miningInstance.doNothing({ from: accounts[0] });
        }

        //block 100
        await miningInstance.claimMVT({ from: accounts[0] });
        balance = await movementTokenInstance.balanceOf(accounts[0]);

        assert.equal(balance, "115000000000000000000", 'Didnt claim 115 MVT');
    });

    it('should claim 0.23 MVT for account1 after stake 250 LP Token', async () =>{

        miningInstance = await MVTUniswapMining.deployed();

        //block 101
        await uniswapV2PairInstance.approve(MVTUniswapMining.address, "500000000000000000000000000", { from: accounts[1] });
        
        //stake 250 LP Token for account 1
        //block 102
        await miningInstance.stake("250000000000000000000", 0, { from: accounts[1] }); 

        //block 103
        await miningInstance.claimMVT({ from: accounts[1] });
        
        balance = await movementTokenInstance.balanceOf(accounts[1]);

        //(1.15)/1250*250
        assert.equal(balance, "230000000000000000", 'Didnt claim 0.23 MVT');
    });

    it('should claim more 1.15 MVT for account1 after 5 blocks', async () =>{

        miningInstance = await MVTUniswapMining.deployed();

        for(i=0; i<4; i++){ //block 104-107
            await miningInstance.doNothing({ from: accounts[1] });
        }

        //block 108
        await miningInstance.claimMVT({ from: accounts[1] });
        
        balance = await movementTokenInstance.balanceOf(accounts[1]);

        //(1.15)/1250*250*5+0.23
        assert.equal(balance, "1380000000000000000", 'Not claming extra 1.15 MVT');
    });


    it('should have 123.74 MVT for account0', async () =>{

        miningInstance = await MVTUniswapMining.deployed();

        //block 109
        await miningInstance.claimMVT({ from: accounts[0] });
        
        balance = await movementTokenInstance.balanceOf(accounts[0]);

        //1.15/1250*1000 * (109-102) + 1.15/1000*1000 * (102-100) + 115
        assert.equal(balance.toString(), "123740000000000000000", 'Did not claim 123.74 MVT');
    });

    it('should accept stake of 1250 LP Token from account2', async() => {

        miningInstance = await MVTUniswapMining.deployed();

        //block 110
        await uniswapV2PairInstance.mint(accounts[2], "100000000000000000000000", { from: accounts[0] });

        //block 111
        await uniswapV2PairInstance.approve(MVTUniswapMining.address, "500000000000000000000000000", { from: accounts[2] });
        
        //block 112
        await miningInstance.stake("1250000000000000000000", 0, { from: accounts[2] }); 

        stake = await miningInstance.stakeHolders(accounts[2]);
        assert.equal(stake, "1250000000000000000000", 'Stake account2 != 1250 LP Token');

    });

    it('should be able to unstake LP Token from account2', async()=>{
        miningInstance = await MVTUniswapMining.deployed();

        //block 113
        await miningInstance.unstake(0, "1250000000000000000000", { from: accounts[2] }); 

        stake = await miningInstance.stakeHolders(accounts[2]);
        assert.equal(stake, "0", 'Stake account2 != 0 LP Token');
    });

    it('should give correct claim balances after current block exceeds endMiningBlockNum', async()=>{

        miningInstance = await MVTUniswapMining.deployed();
        
        for(i=0; i<100; i++){ //block 114-213
            await miningInstance.doNothing({ from: accounts[0] });
        }

        await miningInstance.claimMVT({ from: accounts[0] });
        await miningInstance.claimMVT({ from: accounts[1] });
        await miningInstance.claimMVT({ from: accounts[2] });

        balance0 = await movementTokenInstance.balanceOf(accounts[0]);
        balance1 = await movementTokenInstance.balanceOf(accounts[1]);
        balance2 = await movementTokenInstance.balanceOf(accounts[2]);

        // 123.74+ (112−109)÷1250×1000×1.15 + (113−112)÷2500×1000×1.15 + (200−113)÷1250×1000×1.15 = 207
        assert.equal(balance0.toString(), "207000000000000000000", 'balance account0 != 207 MVT');
        
        // (112−102)÷1250×250×1.15 + (113−112)÷2500×250×1.15 + (200−113)÷1250×250×1.15
        assert.equal(balance1.toString(), "22425000000000000000", 'balance account1 != 22.425 MVT');
        
        // 0+(1.15÷2500×1250)×(113−112) = 0.575
        assert.equal(balance2.toString(), "575000000000000000", 'balance account2 != 0.575 MVT');

    });

    it("should return correct LP Token value when unstake", async()=>{

        miningInstance = await MVTUniswapMining.deployed();

        balance0_before = await uniswapV2PairInstance.balanceOf(accounts[0]);
        balance1_before = await uniswapV2PairInstance.balanceOf(accounts[1]);
        balance2_before = await uniswapV2PairInstance.balanceOf(accounts[2]);

        await miningInstance.unstake(0, "1000000000000000000000", { from: accounts[0] });
        await miningInstance.unstake(0, "250000000000000000000", { from: accounts[1] });
       // await miningInstance.unstake(0, { from: accounts[2] });

        balance0_after = await uniswapV2PairInstance.balanceOf(accounts[0]);
        balance1_after = await uniswapV2PairInstance.balanceOf(accounts[1]);
        balance2_after = await uniswapV2PairInstance.balanceOf(accounts[2]);

        assert.equal(new BN(balance0_after).sub(new BN(balance0_before)), "1000000000000000000000", 'unstake account0 != 1000 LP Token');
        assert.equal(new BN(balance1_after).sub(new BN(balance1_before)), "250000000000000000000", 'unstake account0 != 250 LP Token');
        //assert.equal(new BN(balance2_after).sub(new BN(balance2_before)), "750000000000000000000", 'unstake account0 != 1250 LP Token');

    });

    it("should hold 0 LP Token", async()=>{
        
        miningInstance = await MVTUniswapMining.deployed();

        lpBalanceMining = await uniswapV2PairInstance.balanceOf(MVTUniswapMining.address);
        totalStaked = await miningInstance.totalStaked();


        assert.equal(lpBalanceMining, "0", 'LP Token balance in mining contract is supposed to be 0');
        assert.equal(totalStaked, "0", 'total stake is supposed to be 0');
        
    });

    

    

});