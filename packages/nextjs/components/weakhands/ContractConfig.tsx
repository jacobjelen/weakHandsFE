import { type Abi } from 'viem';
import importContractABI from '~~/app/artifacts/contracts/WeakHands.sol/WeakHands.json';

export interface ContractConfig {
  address: `0x${string}`;
  abi: Abi;
}

const contractConfig: ContractConfig = {
  address: '0xa2acaf9aae7ae087049b65ff5215a43cea132f3b' as const,
  abi: importContractABI.abi as Abi,
} as const;

export default contractConfig;