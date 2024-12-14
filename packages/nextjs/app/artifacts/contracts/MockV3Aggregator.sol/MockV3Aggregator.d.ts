// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { AbiParameterToPrimitiveType, GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface MockV3Aggregator$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "MockV3Aggregator",
  "sourceName": "contracts/MockV3Aggregator.sol",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "_decimals",
          "type": "uint8"
        },
        {
          "internalType": "int256",
          "name": "_initialAnswer",
          "type": "int256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "getAnswer",
      "outputs": [
        {
          "internalType": "int256",
          "name": "",
          "type": "int256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "getTimestamp",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestAnswer",
      "outputs": [
        {
          "internalType": "int256",
          "name": "",
          "type": "int256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestRound",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestRoundData",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "internalType": "int256",
          "name": "answer",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "startedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "updatedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "answeredInRound",
          "type": "uint80"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestTimestamp",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "int256",
          "name": "_answer",
          "type": "int256"
        }
      ],
      "name": "updateAnswer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "bytecode": "0x608060405234801561001057600080fd5b506040516107403803806107408339818101604052810190610032919061014d565b816000806101000a81548160ff021916908360ff16021790555061005b8161006260201b60201c565b505061020e565b806001819055504260028190555060036000815480929190610083906101c6565b919050555080600460006003548152602001908152602001600020819055504260056000600354815260200190815260200160002081905550426006600060035481526020019081526020016000208190555050565b600080fd5b600060ff82169050919050565b6100f4816100de565b81146100ff57600080fd5b50565b600081519050610111816100eb565b92915050565b6000819050919050565b61012a81610117565b811461013557600080fd5b50565b60008151905061014781610121565b92915050565b60008060408385031215610164576101636100d9565b5b600061017285828601610102565b925050602061018385828601610138565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000819050919050565b60006101d1826101bc565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036102035761020261018d565b5b600182019050919050565b6105238061021d6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063a87a20ce1161005b578063a87a20ce14610105578063b5ab58dc14610121578063b633620c14610151578063feaf968c1461018157610088565b8063313ce5671461008d57806350d25bcd146100ab578063668a0f02146100c95780638205bf6a146100e7575b600080fd5b6100956101a3565b6040516100a291906102c4565b60405180910390f35b6100b36101b4565b6040516100c091906102f8565b60405180910390f35b6100d16101ba565b6040516100de919061032c565b60405180910390f35b6100ef6101c0565b6040516100fc919061032c565b60405180910390f35b61011f600480360381019061011a9190610378565b6101c6565b005b61013b600480360381019061013691906103d1565b61023d565b60405161014891906102f8565b60405180910390f35b61016b600480360381019061016691906103d1565b610255565b604051610178919061032c565b60405180910390f35b61018961026d565b60405161019a959493929190610423565b60405180910390f35b60008054906101000a900460ff1681565b60015481565b60035481565b60025481565b8060018190555042600281905550600360008154809291906101e7906104a5565b919050555080600460006003548152602001908152602001600020819055504260056000600354815260200190815260200160002081905550426006600060035481526020019081526020016000208190555050565b60046020528060005260406000206000915090505481565b60056020528060005260406000206000915090505481565b600080600080600060035460015460066000600354815260200190815260200160002054600254600354945094509450945094509091929394565b600060ff82169050919050565b6102be816102a8565b82525050565b60006020820190506102d960008301846102b5565b92915050565b6000819050919050565b6102f2816102df565b82525050565b600060208201905061030d60008301846102e9565b92915050565b6000819050919050565b61032681610313565b82525050565b6000602082019050610341600083018461031d565b92915050565b600080fd5b610355816102df565b811461036057600080fd5b50565b6000813590506103728161034c565b92915050565b60006020828403121561038e5761038d610347565b5b600061039c84828501610363565b91505092915050565b6103ae81610313565b81146103b957600080fd5b50565b6000813590506103cb816103a5565b92915050565b6000602082840312156103e7576103e6610347565b5b60006103f5848285016103bc565b91505092915050565b600069ffffffffffffffffffff82169050919050565b61041d816103fe565b82525050565b600060a0820190506104386000830188610414565b61044560208301876102e9565b610452604083018661031d565b61045f606083018561031d565b61046c6080830184610414565b9695505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006104b082610313565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036104e2576104e1610476565b5b60018201905091905056fea264697066735822122071d98bf090d6cbebec6ae9e48e35497dfa51f0ab8c8a80921ed019853d31e40264736f6c63430008140033",
  "deployedBytecode": "0x608060405234801561001057600080fd5b50600436106100885760003560e01c8063a87a20ce1161005b578063a87a20ce14610105578063b5ab58dc14610121578063b633620c14610151578063feaf968c1461018157610088565b8063313ce5671461008d57806350d25bcd146100ab578063668a0f02146100c95780638205bf6a146100e7575b600080fd5b6100956101a3565b6040516100a291906102c4565b60405180910390f35b6100b36101b4565b6040516100c091906102f8565b60405180910390f35b6100d16101ba565b6040516100de919061032c565b60405180910390f35b6100ef6101c0565b6040516100fc919061032c565b60405180910390f35b61011f600480360381019061011a9190610378565b6101c6565b005b61013b600480360381019061013691906103d1565b61023d565b60405161014891906102f8565b60405180910390f35b61016b600480360381019061016691906103d1565b610255565b604051610178919061032c565b60405180910390f35b61018961026d565b60405161019a959493929190610423565b60405180910390f35b60008054906101000a900460ff1681565b60015481565b60035481565b60025481565b8060018190555042600281905550600360008154809291906101e7906104a5565b919050555080600460006003548152602001908152602001600020819055504260056000600354815260200190815260200160002081905550426006600060035481526020019081526020016000208190555050565b60046020528060005260406000206000915090505481565b60056020528060005260406000206000915090505481565b600080600080600060035460015460066000600354815260200190815260200160002054600254600354945094509450945094509091929394565b600060ff82169050919050565b6102be816102a8565b82525050565b60006020820190506102d960008301846102b5565b92915050565b6000819050919050565b6102f2816102df565b82525050565b600060208201905061030d60008301846102e9565b92915050565b6000819050919050565b61032681610313565b82525050565b6000602082019050610341600083018461031d565b92915050565b600080fd5b610355816102df565b811461036057600080fd5b50565b6000813590506103728161034c565b92915050565b60006020828403121561038e5761038d610347565b5b600061039c84828501610363565b91505092915050565b6103ae81610313565b81146103b957600080fd5b50565b6000813590506103cb816103a5565b92915050565b6000602082840312156103e7576103e6610347565b5b60006103f5848285016103bc565b91505092915050565b600069ffffffffffffffffffff82169050919050565b61041d816103fe565b82525050565b600060a0820190506104386000830188610414565b61044560208301876102e9565b610452604083018661031d565b61045f606083018561031d565b61046c6080830184610414565b9695505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006104b082610313565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036104e2576104e1610476565b5b60018201905091905056fea264697066735822122071d98bf090d6cbebec6ae9e48e35497dfa51f0ab8c8a80921ed019853d31e40264736f6c63430008140033",
  // "linkReferences": {},
  // "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "MockV3Aggregator",
    constructorArgs: [_decimals: AbiParameterToPrimitiveType<{"name":"_decimals","type":"uint8"}>, _initialAnswer: AbiParameterToPrimitiveType<{"name":"_initialAnswer","type":"int256"}>],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<MockV3Aggregator$Type["abi"]>>;
  export function deployContract(
    contractName: "contracts/MockV3Aggregator.sol:MockV3Aggregator",
    constructorArgs: [_decimals: AbiParameterToPrimitiveType<{"name":"_decimals","type":"uint8"}>, _initialAnswer: AbiParameterToPrimitiveType<{"name":"_initialAnswer","type":"int256"}>],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<MockV3Aggregator$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "MockV3Aggregator",
    constructorArgs: [_decimals: AbiParameterToPrimitiveType<{"name":"_decimals","type":"uint8"}>, _initialAnswer: AbiParameterToPrimitiveType<{"name":"_initialAnswer","type":"int256"}>],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<MockV3Aggregator$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "contracts/MockV3Aggregator.sol:MockV3Aggregator",
    constructorArgs: [_decimals: AbiParameterToPrimitiveType<{"name":"_decimals","type":"uint8"}>, _initialAnswer: AbiParameterToPrimitiveType<{"name":"_initialAnswer","type":"int256"}>],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<MockV3Aggregator$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "MockV3Aggregator",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<MockV3Aggregator$Type["abi"]>>;
  export function getContractAt(
    contractName: "contracts/MockV3Aggregator.sol:MockV3Aggregator",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<MockV3Aggregator$Type["abi"]>>;
}
