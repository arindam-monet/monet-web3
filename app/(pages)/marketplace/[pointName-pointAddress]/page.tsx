"use client";

import TradeDetails from "@/components/trade-details";
import TradesView from "@/components/trades-view";
import { Skeleton } from "@/components/ui/skeleton";
import { pointsTableData } from "@/data";
import { AssetListing, ListingStatus } from "@/models/asset-listing.model";
import { apiService } from "@/services/api.service";
import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toTokens } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

const PointPage = () => {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address;
  const pathname = usePathname();
  const pointNameWithAddress = pathname.split("/")[2];

  const pointName = pointNameWithAddress.split("-")[0];
  const pointAddress = pointNameWithAddress.split("-")[1];
  const [selectedListing, setSelectedListing] = useState<
    AssetListing | undefined
  >(undefined);

  const [formattedAssetListings, setFormattedAssetListings] = useState<
    AssetListing[]
  >([]);

  const {
    data: pointAssetInfoData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "marketplace/point-asset-info",
      {
        pointName,
        pointAddress,
      },
    ],
    queryFn: async () => {
      return await apiService.getMarketplacePointAssetInfo(pointAddress);
    },
    enabled: !!pointName && !!pointAddress,
  });

  useEffect(() => {
    if (!pointAssetInfoData?.data) return;
    const pointDecimals = pointAssetInfoData.data.decimals;

    const formattedListings =
      pointAssetInfoData.data.listings.assetListings.map((listing) => {
        return {
          ...listing,
          amount: toTokens(BigInt(listing.amount), pointDecimals),
          totalPrice: toTokens(BigInt(listing.totalPrice), 18),
          pricePerPoint: toTokens(BigInt(listing.pricePerPoint), 18),
        };
      });

    setFormattedAssetListings(formattedListings);
  }, [pointAssetInfoData]);

  const publicListings = formattedAssetListings.filter(
    (listing) => listing.owner !== walletAddress
  );

  const livePublicListings = publicListings.filter(
    (listing) => listing.status === ListingStatus.LIVE
  );

  const completedPublicListings = publicListings.filter(
    (listing) => listing.status === ListingStatus.BOUGHT
  );

  const ownerListings = formattedAssetListings.filter(
    (listing) => listing.owner === walletAddress
  );

  return (
    <main className="pt-16">
      <div className="flex flex-col md:flex-row gap-8 w-full container">
        <div className="flex flex-col gap-4 flex-1">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl pb-2">
                  {pointAssetInfoData?.data.name}{" "}
                  <span className="text-muted-foreground">
                    ({pointAssetInfoData?.data.symbol})
                  </span>
                </h2>
                <Link
                  className="flex gap-2"
                  href={`https://sepolia.basescan.org/tx/${pointAddress}`}
                >
                  <p className="text-sm text-muted-foreground hover:underline">
                    {pointAddress}
                  </p>
                  <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>

              <div className="text-muted-foreground text-2xl">
                <span className="font-bold mr-2">
                  {pointAssetInfoData?.data.points}
                </span>
                <span className="font-light">
                  {pointAssetInfoData?.data.symbol}
                </span>
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-4">Live public listings</h3>
            <TradesView
              assetListings={livePublicListings || []}
              loading={isLoading}
              onListingSelected={(listing) => setSelectedListing(listing)}
            />
          </div>
          <div className="mt-8">
            <h3 className="mb-4 text-muted-foreground">
              Recently completed listings
            </h3>
            <TradesView
              assetListings={completedPublicListings || []}
              loading={isLoading}
            />
          </div>
          <div className="mt-8">
            <h3 className="mb-4 text-muted-foreground">Your listings</h3>
            <TradesView
              assetListings={ownerListings || []}
              loading={isLoading}
            />
          </div>
        </div>
        <div className="w-full md:w-1/3 relative">
          <div className="sticky top-[100px] mt-8">
            <TradeDetails
              pointInfo={{
                name: pointAssetInfoData?.data.name || "",
                symbol: pointAssetInfoData?.data.symbol || "",
              }}
              assetListing={selectedListing}
              onTradeSuccess={() => setSelectedListing(undefined)}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default PointPage;
