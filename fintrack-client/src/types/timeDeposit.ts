// Konum: fintrack-client/src/types/timeDeposit.ts
export interface TimeDeposit {
    id: number;
    sourceAccountName: string;
    principalAmount: number;
    interestRate: number; // Bu artık % olarak gelecek (örn: 45.0)
    startDate: string; // ISO Date String
    endDate: string; // ISO Date String
    maturityAmount: number;
    isActive: boolean;
    annualInterestRate: number; // Yıllık faiz oranı (örn: 0.51)
    maturityAction: MaturityAction;
}

// Hesaplama için yeni türler
export interface DepositCalculationRequest {
    amount: number;
    termInMonths: number;
}

export interface DepositCalculationResponse {
    maturityAmount: number;
    totalInterest: number;
    annualInterestRate: number;
    endDate: string; // ISO date string
}

export interface CreateTimeDepositRequest {
    sourceAccountId: number;
    amount: number;
    termInMonths: number;
    maturityAction: MaturityAction; 
    // annualInterestRate, front'tan'gönderilmiyor, back'te hesaplanıyor, bu yüzden bu request tipinde olmasına gerek yok.
}

// Backend'deki enum'un frontend'deki karşılığı
// Bu, sayısal değerler (0, 1, 2) yerine anlamlı isimler kullanmamızı sağlar
export enum MaturityAction {
    CloseAndTransfer,
    RenewPrincipal,
    RenewAll
}