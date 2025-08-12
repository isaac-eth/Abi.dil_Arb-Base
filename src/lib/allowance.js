import { ethers } from "ethers";
import { ERC20_ABI } from "./erc20Abi";

export async function ensureAllowanceExact({ token, owner, spender, needed, provider }) {
  const signer = provider.getSigner();
  const erc20 = new ethers.Contract(token, ERC20_ABI, signer);

  const current = await erc20.allowance(owner, spender);
  console.log("allowance actual:", current.toString(), "needed:", needed.toString());
  if (current.gte(needed)) return;

  const tx = await erc20.approve(spender, needed);
  console.log("approve tx:", tx.hash);
  await tx.wait();
}
