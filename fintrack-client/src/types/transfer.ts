// src/types/transfer.ts

export interface UserTransferRequestDto {
    fromAccountId: number;
    recipientIban: string;
    recipientName: string;
    amount: number;
    description?: string;
}

export interface InternalTransferDto {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description?: string;
}
