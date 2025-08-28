export interface Account {
    id: number;
    userId: number;
    name: string;
    accountType: string;
    balance: number;
    currency: string;
    iban?: string; // IBAN alanı eklendi 
    createdAt: string;
    isActive: boolean;
}

export interface CreateAccountRequest {
    name: string;
    accountType: string;
    balance: number;
    currency: string;
}

export interface UpdateAccountRequest {
    name?: string;
    accountType?: string;
    balance?: number;
    currency?: string;
    isActive?: boolean;
}