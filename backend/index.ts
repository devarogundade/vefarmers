import express, { Request, Response } from "express";
import cors from "cors";
import {
  adminAddress,
  approve,
  mint,
  repay,
  supply,
} from "./src/contract-service";
import {
  ResolvedRef,
  MintReq,
  SupplyReq,
  Provider,
  ApiResponse,
} from "./src/types";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const resolveRef = async (
  reference: string,
  provider: Provider
): Promise<ResolvedRef | null> => {
  try {
    if (provider === "paystack") {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SK_KEY}`,
          },
        }
      );

      const data = await response.json();
      if (!data.status) return null;

      return data.data.metadata as ResolvedRef;
    }

    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
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

    const ref = await resolveRef(reference, provider);
    if (!ref) {
      return res.status(400).send({
        success: false,
        message: "Invalid reference.",
      } as ApiResponse<string>);
    }

    const mintResult = await mint(ref.fiat, ref.amount, adminAddress);
    if (!mintResult?.success) {
      return res.status(400).send(mintResult);
    }

    const approveResult = await approve(ref.fiat, ref.amount, ref.pool);

    if (!approveResult?.success) {
      return res.status(400).send(approveResult);
    }

    const supplyResult = await supply(ref.pool, ref.amount, ref.behalfOf);
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

    const ref = await resolveRef(reference, provider);
    if (!ref) {
      return res.status(400).send({
        success: false,
        message: "Invalid reference.",
      } as ApiResponse<string>);
    }

    const mintResult = await mint(ref.fiat, ref.amount, adminAddress);
    if (!mintResult?.success) {
      return res.status(400).send({});
    }

    const approveResult = await approve(ref.fiat, ref.amount, ref.pool);

    if (!approveResult?.success) {
      return res.status(400).send(approveResult);
    }

    const repayesult = await repay(ref.pool, ref.amount, ref.behalfOf);
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
