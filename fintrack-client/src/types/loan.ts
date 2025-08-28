// Konum: fintrack-client/src/types/loan.ts
export interface Loan {
    id: number;
    targetAccountName: string;
    loanType: string;
    principalAmount: number;
    interestRate: number; // Yüzde olarak gelir
    termInMonths: number;
    monthlyPayment: number;
    totalRepayment: number;
    startDate: string; // ISO Date String
    isActive: boolean;
}

export interface CreateLoanRequest {
    targetAccountId: number;
    loanType: string;
    amount: number;
    termInMonths: number;
}

// Hesaplama için yeni türler
export interface LoanCalculationRequest {
    amount: number;
    termInMonths: number;
    loanType: string;
}

export interface LoanCalculationResponse {
    monthlyPayment: number;
    totalRepayment: number;
    annualInterestRate: number;
}