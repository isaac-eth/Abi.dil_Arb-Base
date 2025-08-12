import { useState } from 'react';
import { ethers } from 'ethers';
import { ABI } from '../lib/abi';
import { CONTRACT_BY_CHAIN } from '../lib/constants';
import { ensureAllowanceExact } from '../lib/allowance';

export function useManageDeal() {
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const payDeal = async (dealId) => {
    setTxHash(null);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('Wallet no detectada');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const payer = await signer.getAddress();
      const net = await provider.getNetwork();
      const chainId = Number(net.chainId);

      const CONTRACT_ADDRESS = CONTRACT_BY_CHAIN[chainId];
      if (!CONTRACT_ADDRESS) throw new Error(`Red no soportada: ${chainId}`);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const deal = await contract.getDeal(dealId);
      if (!deal || deal.token === ethers.constants.AddressZero) throw new Error('Deal no existe');

      const token = deal.token;
      const cost  = deal.cost;
      const halfCommission = deal.commission.div(2);
      const total = cost.add(halfCommission);

      await ensureAllowanceExact({
        token,
        owner: payer,
        spender: CONTRACT_ADDRESS,
        needed: total,
        provider
      });

      const tx = await contract.payDeal(dealId);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Error pagando deal:', e);
      setError(e.message || String(e));
      throw e;
    }
  };

  const releaseDeal = async (dealId) => {
    setTxHash(null);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('Wallet no detectada');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const net = await provider.getNetwork();
      const chainId = Number(net.chainId);
      const CONTRACT_ADDRESS = CONTRACT_BY_CHAIN[chainId];
      if (!CONTRACT_ADDRESS) throw new Error(`Red no soportada: ${chainId}`);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.releaseDeal(dealId);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Error liberando deal:', e);
      setError(e.message || String(e));
      throw e;
    }
  };

  const cancelDeal = async (dealId) => {
    setTxHash(null);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('Wallet no detectada');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const net = await provider.getNetwork();
      const chainId = Number(net.chainId);
      const CONTRACT_ADDRESS = CONTRACT_BY_CHAIN[chainId];
      if (!CONTRACT_ADDRESS) throw new Error(`Red no soportada: ${chainId}`);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.cancelDeal(dealId);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Error cancelando deal:', e);
      setError(e.message || String(e));
      throw e;
    }
  };

  return { payDeal, releaseDeal, cancelDeal, txHash, error };
}
