// Konum: FinTrack.API/DTOs/CalculationDtos.cs
namespace FinTrack.API.DTOs
{
    // Kredi Hesaplama
    public class LoanCalculationRequestDto
    {
        public decimal Amount { get; set; }
        public int TermInMonths { get; set; }
        public string LoanType { get; set; }
    }

    public class LoanCalculationResponseDto
    {
        public decimal MonthlyPayment { get; set; }
        public decimal TotalRepayment { get; set; }
        public decimal AnnualInterestRate { get; set; }
    }

    // Mevduat Hesaplama
    public class DepositCalculationRequestDto
    {
        public decimal Amount { get; set; }
        public int TermInMonths { get; set; }
    }

    public class DepositCalculationResponseDto
    {
        public decimal MaturityAmount { get; set; }
        public decimal TotalInterest { get; set; }
        public decimal AnnualInterestRate { get; set; }
        public System.DateTime EndDate { get; set; }
    }
}
