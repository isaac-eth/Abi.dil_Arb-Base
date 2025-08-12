// src/hooks/useConsultDeal.js
import { useState } from 'react';
import { ABI } from '../lib/abi';
import { CONTRACT_BY_CHAIN } from '../lib/constants';
import { ethers } from 'ethers';


export const useConsultDeal = () => {
  const [dealInfo, setDealInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const consultDeal = async (dealId) => {
    try {
      if (!window.ethereum) throw new Error("Wallet no conectada");

      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const net = await provider.getNetwork();
      const chainId = Number(net.chainId);
      const CONTRACT_ADDRESS = CONTRACT_BY_CHAIN[chainId];
      if (!CONTRACT_ADDRESS) throw new Error('Contrato no soporta esta red');
      const contract = /* address will be resolved by chain */ new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      const deal = await contract.deals(dealId);

      const parsedDeal = {
        id: dealId,
        seller: deal.creator,
        buyer: deal.payer,
        token: deal.token,
        amount: ethers.utils.formatUnits(deal.cost, 6), // 6 decimales para USDC
        status: deal.canceled
          ? 'Cancelado'
          : deal.released
          ? 'Liberado'
          : deal.paid
          ? 'Pagado'
          : 'Creado',
      };

      setDealInfo(parsedDeal);
    } catch (err) {
      console.error('Error consultando deal:', err);
      alert("No se pudo consultar el trato. Revisa la consola.");
      setDealInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return { consultDeal, dealInfo, loading };
};
