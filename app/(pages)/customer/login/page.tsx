"use client";

import { connectWallet } from "@/app/thirdweb";
import LoginCustomer from "@/components/login-customer";
import useLocalStorage from "@/hooks/useLocalStorage";
import { authenticate, login } from "@/lib/api-requests";
import { useUserStore } from "@/store/userStore";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";

const CustomerLoginPage = () => {
  const { connect } = useConnect();
  const activeAccount = useActiveAccount();
  const [accessToken, setAccessToken] = useLocalStorage("accessToken", "");
  const [loginRequested, setLoginRequested] = useState(false);
  const router = useRouter();
  const userStore = useUserStore();
  const authMutation = useMutation({
    mutationFn: authenticate,
  });

  const handleLoginCustomer = async () => {
    setLoginRequested(true);
    await connectWallet(connect);
  };

  const redirectToVerfication = () => {
    router.push("/customer/verify");
  };

  const redirectToDashboard = () => {
    router.push("/customer/dashboard");
  };

  useEffect(() => {
    if (activeAccount && loginRequested) {
      if (!accessToken) {
        redirectToVerfication();
      }
      authMutation.mutate(
        {
          walletAddress: activeAccount.address,
          accessToken,
        },
        {
          onSuccess: (response) => {
            const { accessToken, user } = response.data;
            setAccessToken(accessToken);
            userStore.setUser(user);
            redirectToDashboard();
          },
          onError: () => {
            redirectToVerfication();
          },
        }
      );
    }
  }, [activeAccount]);

  return (
    <main>
      <LoginCustomer
        onClickConnectWallet={handleLoginCustomer}
        loading={authMutation.isPending}
      />
    </main>
  );
};

export default CustomerLoginPage;
