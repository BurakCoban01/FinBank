export enum TransactionType {
    Income,
    Expense,
    GidenTransfer,
    GelenTransfer,
    EFTGonderim,
    EFTAlim,
    YatirimAlim,
    YatirimSatim,
    NakitYatirma,
    NakitCekme,
}

export interface Transaction {
    id: number;
    accountId: number;
    accountName: string;
    accountCurrency?: string;
    categoryId?: number;
    categoryName?: string;
    categoryColor?: string;
    amount: number;
    description?: string;
    transactionDate: string; // ISO Date string
    type: TransactionType; // Artık string tabanlı enum
    createdAt: string; // ISO Date string
}

export interface CreateTransactionRequest {
    accountId: number;
    categoryId?: number | null;
    amount: number;
    description?: string;
    date?: Date;
    transactionDate?: string;
    type: TransactionType;
    marketAssetId?: number;
    quantity?: number;
}

export interface UpdateTransactionRequest {
    accountId?: number;
    categoryId?: number | null;
    amount?: number;
    description?: string;
    transactionDate?: string;
    type?: TransactionType;
}

export interface CreateDepositWithdrawalRequest {
    accountId: number;
    amount: number;
    description?: string;
}

export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    transactionCount: number;
}
