import { Request } from "express";
import { UserAccount } from "../structures/UserAccount";

export type ErrorObject = {
    status: number;
    error: number;
    data: Record<string, any>;
}

export interface ApiRequest extends Request {
    id?: string;
    account?: UserAccount
}