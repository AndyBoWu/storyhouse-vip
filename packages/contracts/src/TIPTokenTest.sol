// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TIP Token Test Version
 * @dev Test version of TIP token for development and testing
 */
contract TIPTokenTest is ERC20, ERC20Burnable, Ownable, Pausable {
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event SupplyCapUpdated(uint256 oldCap, uint256 newCap);

    // State variables
    mapping(address => bool) public minters;

    // Constants and configuration
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1B TIP tokens
    uint256 public supplyCap = 10_000_000_000 * 10 ** 18; // 10B TIP tokens (can be updated)

    modifier onlyMinter() {
        require(minters[msg.sender], "TIPTokenTest: caller is not a minter");
        _;
    }

    constructor(address initialOwner) ERC20("TIP Token Test", "TIPT") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
        minters[initialOwner] = true;
        emit MinterAdded(initialOwner);
    }

    /**
     * @dev Add a new minter (only owner)
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "TIPTokenTest: zero address");
        require(!minters[_minter], "TIPTokenTest: already a minter");

        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @dev Remove a minter (only owner)
     * @param _minter Address to remove as minter
     */
    function removeMinter(address _minter) external onlyOwner {
        require(minters[_minter], "TIPTokenTest: not a minter");

        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @dev Mint tokens to an address (only minters)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        require(totalSupply() + amount <= supplyCap, "TIPTokenTest: supply cap exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Update supply cap (only owner)
     * @param newCap New supply cap (must be >= current total supply)
     */
    function updateSupplyCap(uint256 newCap) external onlyOwner {
        require(newCap >= totalSupply(), "TIPTokenTest: cap below current supply");

        uint256 oldCap = supplyCap;
        supplyCap = newCap;
        emit SupplyCapUpdated(oldCap, newCap);
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override _update to respect pause state
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Get remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return supplyCap - totalSupply();
    }

    /**
     * @dev Check if address is a minter
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
} 
