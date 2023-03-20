import { Request } from "express";
import { DisplayAccount } from "../models/DisplayAccount";

export type ErrorObject = {
    status: number;
    error: number;
    data: Record<string, any>;
}

export interface ApiRequest extends Request {
    id?: string;
    account?: DisplayAccount
}