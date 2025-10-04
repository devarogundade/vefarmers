import express, { Request, Response } from "express";
import cors from "cors";
import {
  adminAddress,
  approve,
  mint,
  repay,
  supply,
} from "./src/contract-service";

type Provider = "paystack" | "stripe";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

interface SupplyReq {
  reference: string;
  provider: Provider;
}

const resolveRef = async (
  reference: string,
  provider: Provider
): Promise<ResolvedRef> => {
  if (provider === "paystack") {
    return { pool: "", fiat: "", amount: "0", behalfOf: "" };
  }

  return { pool: "", fiat: "", amount: "0", behalfOf: "" };
};

app.post("/api/mint", async (req: Request, res: Response) => {
  try {
    const { fiat, account, amount } = req.body as MintReq;
    const mintResult = await mint(fiat, amount, account);
    if (!mintResult?.success) {
      return res.status(400).send(mintResult);
    }
    res.send(mintResult);
  } catch (error) {
    res.status(500).send({});
  }
});

app.post("/api/supply-on-behalf", async (req: Request, res: Response) => {
  try {
    const { reference, provider } = req.body as SupplyReq;

    const resolvedRef = await resolveRef(reference, provider);

    const mintResult = await mint(
      resolvedRef.fiat,
      resolvedRef.amount,
      adminAddress
    );
    if (!mintResult?.success) {
      return res.status(400).send(mintResult);
    }

    const approveResult = await approve(
      resolvedRef.fiat,
      resolvedRef.amount,
      resolvedRef.pool
    );

    if (!approveResult?.success) {
      return res.status(400).send(approveResult);
    }

    const supplyResult = await supply(
      resolvedRef.pool,
      resolvedRef.amount,
      resolvedRef.behalfOf
    );
    if (!supplyResult?.success) {
      return res.status(400).send(supplyResult);
    }

    res.send(supplyResult);
  } catch (error) {
    res.status(500).send({});
  }
});

app.post("/api/repay-on-behalf", async (req: Request, res: Response) => {
  try {
    const { reference, provider } = req.body as {
      reference: string;
      provider: Provider;
    };

    const resolvedRef = await resolveRef(reference, provider);

    const mintResult = await mint(
      resolvedRef.fiat,
      resolvedRef.amount,
      adminAddress
    );
    if (!mintResult?.success) {
      return res.status(400).send({});
    }

    const approveResult = await approve(
      resolvedRef.fiat,
      resolvedRef.amount,
      resolvedRef.pool
    );

    if (!approveResult?.success) {
      return res.status(400).send(approveResult);
    }

    const repayesult = await repay(
      resolvedRef.pool,
      resolvedRef.amount,
      resolvedRef.behalfOf
    );
    if (!repayesult?.success) {
      return res.status(400).send(repayesult);
    }

    res.send(repayesult);
  } catch (error) {
    res.status(500).send({});
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
