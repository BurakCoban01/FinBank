export interface UserDto {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

export interface AccountDto {
    id: number;
    userId: number;
    name: string;
    accountType: string;
    balance: number;
    currency: string;
    createdAt: string;
    isActive: boolean;
}

export interface CreateAccountDto {
    name: string;
    accountType: string;
    balance: number;
    currency: string;
}

export interface UpdateAccountDto {
    name?: string;
    accountType?: string;
    balance?: number;
    currency?: string;
    isActive?: boolean;
}

export enum TransactionType {
    Income = 0, // Backend enum ile eşleşmeli 
    Expense = 1,
    Transfer = 2,
}

export interface TransactionDto {
    id: number;
    accountId: number;
    accountName: string;
    categoryId?: number;
    categoryName?: string;
    amount: number;
    description: string;
    transactionDate: string; // ISO Date string
    type: TransactionType;
    createdAt: string; // ISO Date string
}

export interface CreateTransactionDto {
    accountId: number;
    categoryId?: number;
    amount: number;
    description?: string;
    transactionDate?: string; // ISO Date string
    type: TransactionType;
}

export interface UpdateTransactionDto {
    accountId?: number;
    categoryId?: number;
    amount?: number;
    description?: string;
    transactionDate?: string; // ISO Date string
    type?: TransactionType;
}

export interface CategoryDto {
    id: number;
    name: string;
    description: string;
    iconName: string;
    color: string;
}