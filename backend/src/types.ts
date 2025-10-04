interface ResolvedRef {
  pool: string;
  fiat: string;
  amount: string;
  behalfOf: string;
}

interface MintReq {
  fiat: string;
  account: string;
  amount: string;
}

type Provider = "paystack";

interface SupplyReq {
  reference: string;
  provider: Provider;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  txId?: string;
}

export { ResolvedRef, MintReq, SupplyReq, Provider, ApiResponse };
