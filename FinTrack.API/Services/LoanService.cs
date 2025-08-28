// Konum: FinTrack.API/Services/LoanService.cs
using AutoMapper;
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class LoanService : ILoanService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public LoanService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<LoanDto>> GetLoansByUserIdAsync(int userId)
        {
            var loans = await _context.Loans
                .Include(l => l.TargetAccount)
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();
            return _mapper.Map<List<LoanDto>>(loans);
        }

        // İhtiyaç (teminatsız) en yüksek, Konut (teminatlı) en düşük faize sahip olacak şekilde ayarlandı
        private decimal GetAnnualInterestRate(string loanType, int termInMonths)
        {
            decimal baseRate;

            // 1. Kredi türüne göre taban faiz oranını belirlenmesi
            switch (loanType)
            {
                case "Konut Kredisi":
                    baseRate = 0.45m; // %45
                    break;
                case "Taşıt Kredisi":
                    baseRate = 0.55m; // %55
                    break;
                case "İhtiyaç Kredisi":
                default: // Varsayılan olarak en yüksek oranlıyı atama
                    baseRate = 0.65m; // %65
                    break;
            }

            // 2. Vadeye göre oranı hafifçe ayarlama (uzun vadede oran biraz düşer)
            if (termInMonths > 60) // 5+ yıl
            {
                baseRate -= 0.05m;
            }
            else if (termInMonths > 36) // 3+ yıl
            {
                baseRate -= 0.03m;
            }

            return baseRate < 0.20m ? 0.20m : baseRate; // Minimum oranın altına düşmesini engelleme
        }

        public async Task<LoanDto> CreateLoanAsync(CreateLoanDto dto, int userId)
        {
            var targetAccount = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == dto.TargetAccountId && a.UserId == userId);

            if (targetAccount == null)
                throw new InvalidOperationException("Hedef hesap bulunamadı veya kullanıcıya ait değil.");

            var annualInterestRate = GetAnnualInterestRate(dto.LoanType, dto.TermInMonths);
            var monthlyInterestRate = annualInterestRate / 12;
            var term = dto.TermInMonths;
            var principal = dto.Amount;

            // Aylık Taksit Hesaplama (Eşit Anapara Geri Ödemeli Kredi Formülü)
            decimal monthlyPayment;
            if (monthlyInterestRate > 0)
            {
                var rateFactor = (decimal)Math.Pow(1 + (double)monthlyInterestRate, term);
                monthlyPayment = principal * ((monthlyInterestRate * rateFactor) / (rateFactor - 1));
            }
            else // Faizsiz kredi durumu
            {
                monthlyPayment = principal / term;
            }

            var totalRepayment = monthlyPayment * term;

            var loan = new Loan
            {
                UserId = userId,
                TargetAccountId = dto.TargetAccountId,
                LoanType = dto.LoanType,
                PrincipalAmount = principal,
                InterestRate = annualInterestRate,
                TermInMonths = term,
                MonthlyPayment = monthlyPayment,
                TotalRepayment = totalRepayment,
                StartDate = DateTime.UtcNow,
                IsActive = true
            };

            // Kredi tutarını hedef hesabın bakiyesine ekleme
            targetAccount.Balance += principal;
            _context.Accounts.Update(targetAccount);

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            await _context.Entry(loan).Reference(l => l.TargetAccount).LoadAsync();

            return _mapper.Map<LoanDto>(loan);
        }

        public LoanCalculationResponseDto CalculateLoan(LoanCalculationRequestDto dto)
        {
            var annualInterestRate = GetAnnualInterestRate(dto.LoanType, dto.TermInMonths);
            var monthlyInterestRate = annualInterestRate / 12;
            var term = dto.TermInMonths;
            var principal = dto.Amount;

            decimal monthlyPayment;
            if (monthlyInterestRate > 0)
            {
                var rateFactor = (decimal)Math.Pow(1 + (double)monthlyInterestRate, term);
                monthlyPayment = principal * ((monthlyInterestRate * rateFactor) / (rateFactor - 1));
            }
            else
            {
                monthlyPayment = principal / term;
            }

            var totalRepayment = monthlyPayment * term;

            return new LoanCalculationResponseDto
            {
                AnnualInterestRate = annualInterestRate * 100, // Yüzde olarak döndür
                MonthlyPayment = monthlyPayment,
                TotalRepayment = totalRepayment
            };
        }
    }
}