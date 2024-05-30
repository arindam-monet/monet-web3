import { Customer } from "./customer.model";
import { AuthTokens, Company } from "./company.model";
import { Point } from "./point.model";
import { Admin } from "./admin.model";

export interface VerifyWalletResponse {
  words: string;
  isRegistered: boolean;
}

export interface VerifyCompanySubmitRequestResponse {
  company: Company;
  tokens: AuthTokens;
}

export interface VerifyCustomerSubmitRequestResponse {
  customer: Customer;
  tokens: AuthTokens;
}
export interface VerifyAdminSubmitRequestResponse {
  admin: Admin;
  tokens: AuthTokens;
}
export interface AuthResponse {
  id: string;
  email: string;
  name: null;
  password: null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  wallet_address: string;
  roles: Role[];
  company: LinkedCompany;
  customer: LinkedCustomer;
}

export interface CustomerPointResponse {
  points: Point[];
}

interface LinkedCompany {
  id: string;
}

interface LinkedCustomer {
  id: string;
}

interface Role {
  userId: string;
  role: string;
}