import { Request } from "express";
import { Account } from "../models/Account";

export type ErrorObject = {
    status: number;
    error: number;
    data: Record<string, any>;
}

export interface ApiRequest extends Request {
    id?: string;
    account?: Account
}