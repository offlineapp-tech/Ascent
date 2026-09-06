/* ASCENT Protocol — deployment configuration.
   While addresses are empty the app runs in PREVIEW MODE (simulated figures,
   transactions disabled). Paste deployed contract addresses to go live. */

window.ASCENT_CONFIG = {
  network: {
    name: "Robinhood Chain Testnet",
    chainId: 46630,          // Robinhood mainnet: 4663 · Ethereum: 1
    chainIdHex: "0xB626",
    rpcUrl: "https://rpc.testnet.chain.robinhood.com",
    explorer: "https://explorer.testnet.chain.robinhood.com",
    currency: {name: "Ether", symbol: "ETH", decimals: 18},
  },

  contracts: {
    ascentToken: "",   // $ASCENT (ERC-20)
    staking: "",
    launchpad: "",
    governance: "",
    router: "",        // swap & bridge entrypoint
  },
};
