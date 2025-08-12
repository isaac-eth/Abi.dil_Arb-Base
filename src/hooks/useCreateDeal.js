import { useState } from 'react';
import { ethers } from 'ethers';
import { ABI } from '../lib/abi';
import { CONTRACT_BY_CHAIN } from '../lib/constants';
import { ensureAllowanceExact } from '../lib/allowance';

export function useCreateDeal() {
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const createDeal = async ({ selectedToken, amount }) => {
    setTxHash(null);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('Wallet no detectada');

      // Asegura conexión de la cuenta
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const owner = await signer.getAddress();
      const net = await provider.getNetwork();
      const chainId = Number(net.chainId);

      const CONTRACT_ADDRESS = CONTRACT_BY_CHAIN[chainId];
      if (!CONTRACT_ADDRESS) throw new Error(`Red no soportada: ${chainId}`);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // Monto -> 6 decimales
      const costHuman = parseFloat((amount || '').toString().replace(',', '.'));
      if (isNaN(costHuman) || costHuman <= 0) throw new Error("Monto inválido");
      const cost = ethers.BigNumber.from(Math.round(costHuman * 1e6));

      // Validaciones previas
      if (!selectedToken) throw new Error("Token no seleccionado");
      const allowed = await contract.allowedTokens(selectedToken);
      if (!allowed) throw new Error("Token no permitido por el contrato");

      // Comisión
      const percent = await contract.commissionPercent();    // bps
      const noFee   = await contract.noFeeWallets(owner);
      let commission = ethers.BigNumber.from(0);
      if (!noFee) commission = cost.mul(percent).div(10000);
      const halfCommission = commission.div(2);

      // Allowance exacto para la comisión de create
      if (halfCommission.gt(0)) {
        await ensureAllowanceExact({
          token: selectedToken,
          owner,
          spender: CONTRACT_ADDRESS,
          needed: halfCommission,
          provider
        });
      }

      // Tx create
      const tx = await contract.createDeal(selectedToken, cost);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Error creando deal:', e);
      setError(e.message || String(e));
      throw e;
    }
  };

  return { createDeal, txHash, error };
}
