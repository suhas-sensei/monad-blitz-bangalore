import type { Abi } from 'viem'
import { CONTRACT_ABI } from '../abi (1)'

export const PREDICTION_ADDRESS = (
  process.env.NEXT_PUBLIC_PREDICTION_CONTRACT as `0x${string}` | undefined
) ?? ('0xBcDcEFD400AF9F2412932503A738f990b244757E' as const)

export const PREDICTION_ABI = CONTRACT_ABI as Abi
