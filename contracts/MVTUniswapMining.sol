//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MVTUniswapMiningStorage.sol";

 
contract MVTUniswapMining is Ownable, Pausable, MVTUniswapMiningStorage {
  
  event Staked(address indexed user, uint256 amount, uint256 total, uint256 lockedUntil);
  event Unstaked(address indexed user, uint256 amount, uint256 total);
  event ClaimedMVT(address indexed user, uint amount, uint total);

  function initiate(uint _startMiningBlocknum, uint _totalMiningBlockNum, uint _MVTPerBlock, ERC20 _MVT, ERC20 _lp) public onlyOwner{
    require(initiated==false, "contract is already initiated");
    initiated = true;

    require(_totalMiningBlockNum >= 100, "_totalMiningBlockNum is too small");

    if(_startMiningBlocknum == 0){
      _startMiningBlocknum = block.number;
    }

    _MVT.totalSupply(); //sanity check
    _lp.totalSupply(); //sanity check

    startMiningBlockNum = _startMiningBlocknum;
    totalMiningBlockNum = _totalMiningBlockNum;
    endMiningBlockNum = startMiningBlockNum + totalMiningBlockNum;
    miningStateBlock = startMiningBlockNum;
    MVTPerBlock = _MVTPerBlock;
    MVTToken = _MVT;
    LPToken = _lp;

  }

  // @notice stake some LP tokens
  // @param _amount some amount of LP tokens, requires enought allowance from LP token smart contract
  // @param _locked the locking period; option: 0, 30 days (2592000), 90 days (7776000), 180 days (15552000), 360 days (31104000)
  function stake(uint256 _amount, uint256 _locked) public whenNotPaused{
      
      createStake(msg.sender, _amount, _locked);
  }
  
  // @notice internal function for staking
  function createStake(
    address _address,
    uint256 _amount,
    uint256 _locked
  )
    internal
  {

    claimMVT();
    
    require(block.number<endMiningBlockNum, "staking period has ended");
    require(_locked == 0 || _locked == 30 days || _locked == 90 days || _locked == 180 days || _locked == 360 days  , "invalid locked period" );
      
    require(
      LPToken.transferFrom(_address, address(this), _amount),
      "Stake required");

    uint _lockedUntil = block.timestamp.add(_locked);
    uint _powerRatio;
    uint _power;

    if(_locked == 0){
        _powerRatio = 1;
    } else if(_locked == 30 days){
        _powerRatio = 2;
    } else if(_locked == 90 days){
        _powerRatio = 3;
    } else if(_locked == 180 days){
        _powerRatio = 4;
    } else if(_locked == 360 days){
        _powerRatio = 5;
    }

    _power = _amount.mul(_powerRatio);

    Stake memory _stake = Stake(_amount, _lockedUntil, _locked, _power, true);
    stakes[_address].push(_stake);
    stakeCount[_address] = stakeCount[_address].add(1);
    stakerPower[_address] = stakerPower[_address].add(_power);

    stakeHolders[_address] = stakeHolders[_address].add(_amount);
    totalStaked = totalStaked.add(_amount);
    totalStakedPower = totalStakedPower.add(_power);

    emit Staked(
      _address,
      _amount,
      stakeHolders[_address],
      _lockedUntil);
  }
  
  // @notice unstake LP token
  // @param _index the index of stakes array
  function unstake(uint256 _index, uint256 _amount) public whenNotPaused{

    require(stakes[msg.sender][_index].exists == true, "stake index doesn't exist");
    require(stakes[msg.sender][_index].amount == _amount, "stake amount doesn't match");

    withdrawStake(msg.sender, _index);
      
  }

  // @notice internal function for removing stake and reorder the array
  function removeStake(address _address, uint index) internal {
      for (uint i = index; i < stakes[_address].length-1; i++) {
          stakes[_address][i] = stakes[_address][i+1];
      }
      stakes[_address].pop();
  }
  
  // @notice internal function for unstaking
  function withdrawStake(
    address _address,
    uint256 _index
  )
    internal
  {

    claimMVT();

    if(block.number <= endMiningBlockNum){ //if current block is lower than endMiningBlockNum, check lockedUntil
      require(stakes[_address][_index].lockedUntil <= block.timestamp, "the stake is still locked");
    }

    uint _amount = stakes[_address][_index].amount;
    uint _power = stakes[_address][_index].stakePower;

    if(_amount > stakeHolders[_address]){ //if amount is larger than owned
      _amount = stakeHolders[_address];
    }

    require(
      LPToken.transfer(_address, _amount),
      "Unable to withdraw stake");
    
    removeStake(_address, _index);
    stakeCount[_address] = stakeCount[_address].sub(1);
    
    stakerPower[_address] = stakerPower[_address].sub(_power);
    totalStakedPower = totalStakedPower.sub(_power);
    stakeHolders[_address] = stakeHolders[_address].sub(_amount);
    totalStaked = totalStaked.sub(_amount);

    updateMiningState();

    emit Unstaked(
      _address,
      _amount,
      stakeHolders[_address]);
  }
  
  // @notice internal function for updating mining state
  function updateMiningState() internal{
    
    if(miningStateBlock == endMiningBlockNum){ //if miningStateBlock is already the end of program, dont update state
        return;
    }
    
    (miningStateIndex, miningStateBlock) = getMiningState(block.number);
    
  }
  
  // @notice calculate current mining state
  function getMiningState(uint _blockNum) public view returns(uint, uint){

    require(_blockNum >= miningStateBlock, "_blockNum must be >= miningStateBlock");
      
    uint blockNumber = _blockNum;
      
    if(_blockNum>endMiningBlockNum){ //if current block.number is bigger than the end of program, only update the state to endMiningBlockNum
        blockNumber = endMiningBlockNum;   
    }
      
    uint deltaBlocks = blockNumber.sub(miningStateBlock);
    
    uint _miningStateBlock = miningStateBlock;
    uint _miningStateIndex = miningStateIndex;
    
    if (deltaBlocks > 0 && totalStaked > 0) {
        uint MVTAccrued = deltaBlocks.mul(MVTPerBlock);
        uint ratio = MVTAccrued.mul(1e18).div(totalStakedPower); //multiple ratio to 1e18 to prevent rounding error
        _miningStateIndex = miningStateIndex.add(ratio); //index is 1e18 precision
        _miningStateBlock = blockNumber;
    } 
    
    return (_miningStateIndex, _miningStateBlock);
    
  }
  
  // @notice claim MVT based on current state 
  function claimMVT() public whenNotPaused {
      
      updateMiningState();
      
      uint claimableMVT = claimableMVT(msg.sender);
      
      stakerIndexes[msg.sender] = miningStateIndex;
      
      if(claimableMVT > 0){
          
          stakerClaimed[msg.sender] = stakerClaimed[msg.sender].add(claimableMVT);
          totalClaimed = totalClaimed.add(claimableMVT);
          MVTToken.transfer(msg.sender, claimableMVT);
          emit ClaimedMVT(msg.sender, claimableMVT, stakerClaimed[msg.sender]);
          
      }
  }
  
  // @notice calculate claimable MVT based on current state
  function claimableMVT(address _address) public view returns(uint){
      uint stakerIndex = stakerIndexes[_address];
        
        // if it's the first stake for user and the first stake for entire mining program, set stakerIndex as stakeInitialIndex
        if (stakerIndex == 0 && totalStaked == 0) {
            stakerIndex = stakeInitialIndex;
        }
        
        //else if it's the first stake for user, set stakerIndex as current miningStateIndex
        if(stakerIndex == 0){
            stakerIndex = miningStateIndex;
        }
      
      uint deltaIndex = miningStateIndex.sub(stakerIndex);
      uint MVTDelta = deltaIndex.mul(stakerPower[_address]).div(1e18);
      
      return MVTDelta;
          
  }

    // @notice test function
    function doNothing() public{
    }

    /*======== admin functions =========*/

    // @notice admin function to pause the contract
    function pause() public onlyOwner{
      _pause();
    }

    // @notice admin function to unpause the contract
    function unpause() public onlyOwner{
      _unpause();
    }

    // @notice admin function to send MVT to external address, for emergency use
    function sendMVT(address _to, uint _amount) public onlyOwner{
      MVTToken.transfer(_to, _amount);
    }
    
}
