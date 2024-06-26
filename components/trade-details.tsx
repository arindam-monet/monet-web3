"use client";
import React from "react";

type Props = {
  pointInfo?: {
    name: string;
    symbol: string;
  };
  assetListing?: AssetListing;
  onTradeSuccess?: () => void;
  onTradeError?: () => void;
};
import { Card, CardContent } from "@/components/ui/card";

import { Button } from "./ui/button";
import { Pointer } from "lucide-react";
import {
  AssetListing,
  ListingStatus,
  ListingType,
} from "@/models/asset-listing.model";
import clsx from "clsx";
import {
  PreparedTransaction,
  prepareContractCall,
  readContract,
  toTokens,
  toUnits,
  toWei,
} from "thirdweb";
import {
  monetMarketplaceContract,
  monetPointsContractFactory,
} from "@/app/contract-utils";
import { toast } from "sonner";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { usePathname } from "next/navigation";

const TradeDetails: React.FC<Props> = ({
  assetListing,
  pointInfo,
  onTradeError,
  onTradeSuccess,
}) => {
  const { name, symbol } = pointInfo || { name: "", symbol: "" };
  const pathname = usePathname();
  const activeAccount = useActiveAccount();
  const pointAddress = pathname.split("/")[2].split("-")[1];
  const { mutate: sendTransaction, isPending, isError } = useSendTransaction();
  const handleListingTrade = async () => {
    if (!assetListing || !assetListing?.Id || !assetListing.amount) return;

    const isSelling = assetListing.listingType === ListingType.BUY;

    const decimals = await readContract({
      contract: monetPointsContractFactory(assetListing.asset),
      method: "decimals",
    });

    const executeTrade = async () => {
      const transaction = await prepareContractCall({
        contract: monetMarketplaceContract,
        method: "trade",
        params: [
          BigInt(assetListing.Id),
          toUnits(assetListing.amount, decimals),
        ],
        value:
          assetListing.listingType === ListingType.SELL
            ? toWei(assetListing.totalPrice)
            : undefined,
      });

      await sendTransaction(transaction as PreparedTransaction, {
        onSuccess: (result) => {
          console.log({ result }, "result");
          toast.success("Trade executed successfully");
          onTradeSuccess && onTradeSuccess();
        },

        onError: (error) => {
          console.log(error, "error");
          toast.error("Transaction failed");
          onTradeError && onTradeError();
        },
      });
    };

    if (isSelling) {
      // When performing a sell trade, the marketplace needs to be approved
      // to sell the assets on behalf of the seller

      const allowanceFunction = async () => {
        if (!activeAccount) return;
        const data = await readContract({
          contract: monetPointsContractFactory(pointAddress),
          method: "allowance",
          params: [
            activeAccount?.address,
            process.env.NEXT_PUBLIC_MONET_MARKETPLACE_CONTRACT!,
          ],
        });
        console.log(data, "allowance data");
        return toTokens(data, decimals);
      };

      const allowanceValue = await allowanceFunction();
      // console.log(
      //   allowanceValue,
      //   values.quantity,
      //   Number(allowanceValue) < Number(values.quantity)
      // );

      const performApproval = async (amount: string) => {
        const transaction = await prepareContractCall({
          contract: monetPointsContractFactory(pointAddress),
          method: "approve",
          params: [
            monetMarketplaceContract.address,
            BigInt(toUnits(amount, decimals)),
          ],
        });
        await sendTransaction(transaction as PreparedTransaction, {
          onSuccess: async () => {
            console.log("Approved");
            await executeTrade();
            return;
          },
          onError: () => {
            console.log("Error approving");
          },
        });
      };

      if (Number(allowanceValue) < Number(assetListing.amount)) {
        await performApproval(
          (Number(assetListing.amount) - Number(allowanceValue)).toString()
        );
      } else {
        await executeTrade();
        return;
      }
    }

    await executeTrade();
  };

  return (
    <Card
      className={clsx("w-full bg-muted", {
        "outline outline-2 outline-green-600":
          assetListing?.listingType === ListingType.BUY,
        "outline outline-2 outline-red-600":
          assetListing?.listingType === ListingType.SELL,
      })}
    >
      <CardContent className="flex flex-col pt-4 w-full min-h-[400px] h-full">
        {!assetListing ? (
          <div className="text-muted-foreground flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center gap-8">
              <Pointer className="h-12 w-12" />
              <p className="text-lg">Select an offer to view details</p>
            </div>
          </div>
        ) : null}

        {assetListing ? (
          <div className="flex flex-col flex-grow">
            <div className="flex-grow">
              <p className="text-2xl">
                {assetListing.listingType === ListingType.BUY
                  ? "Selling"
                  : "Buying"}
              </p>
              <h3 className="font-bold text-4xl mt-2">
                {assetListing.amount} <span className="font-thin">{symbol || 'points'}</span>
              </h3>
              <p className="mt-2">for an offer price of</p>
              <div className="mt-2">
                <span className="text-3xl font-semibold">
                  {assetListing.totalPrice}
                </span>
                <span className="text-sm font-normal">ETH</span>
              </div>
              <span className="text-xs mt-2 text-muted-foreground">
                ({assetListing.pricePerPoint} ETH per point)
              </span>
              <p className="mt-2">from</p>
              <p className="text-xs mt-2">{assetListing.owner}</p>
            </div>

            <div className="mt-auto">
              <Button
                className="mt-2 w-full"
                size={"lg"}
                disabled={assetListing.status !== ListingStatus.LIVE}
                onClick={handleListingTrade}
                loading={isPending}
              >
                {assetListing.status === ListingStatus.LIVE ? (
                  <span>
                    {assetListing.listingType === ListingType.BUY
                      ? "Sell"
                      : "Buy"}
                  </span>
                ) : null}

                {assetListing.status !== ListingStatus.LIVE ? (
                  <span>
                    {assetListing.status === ListingStatus.BOUGHT
                      ? "Bought"
                      : null}
                    {assetListing.status === ListingStatus.CANCELLED
                      ? "Cancelled"
                      : null}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TradeDetails;
