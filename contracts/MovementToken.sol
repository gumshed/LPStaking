//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
 
contract MovementToken is ERC20, Ownable{
    constructor() public ERC20("The Movement", "MVT")  {

    }

    function mint(address _to, uint _amount) public onlyOwner{
        _mint(_to, _amount);
    }
}

