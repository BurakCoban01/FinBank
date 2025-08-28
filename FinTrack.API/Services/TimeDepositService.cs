// Konum: FinTrack.API/Services/TimeDepositService.cs
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
    public class TimeDepositService : ITimeDepositService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IMarketDataService _marketDataService;

        public TimeDepositService(AppDbContext context, IMapper mapper, IMarketDataService marketDataService)
        {
            _context = context;
            _mapper = mapper;
            _marketDataService = marketDataService;
        }

        // zamana göre orantılı düşüş 
        private async Task<decimal> GetAnnualInterestRate(int termInMonths)
       {
           // 1 aylıkta %policyRate, 12 aylıkta %policyRate–16 olacak şekilde
           double policyRateDouble = await _marketDataService.GetTCMBPolicyRateAsync();
            decimal policyRate = (decimal)policyRateDouble;

            // 12 aya kadar toplam 16 puanlık azalma
            decimal totalDrop = 16m;
           int maxTerm = 12;

           // Her aya düşecek miktar
           decimal dropPerMonth = totalDrop / (maxTerm - 1);

            decimal rawRate = policyRate - dropPerMonth * (termInMonths - 1);
            
            // 3) En yakın .00 veya .50’ye yuvarla
            decimal halfSteps = Math.Round(rawRate * 2m, MidpointRounding.AwayFromZero); // tam adım
            decimal roundedRate = halfSteps / 2m;
            
            decimal fraction = roundedRate / 100m;
            // 4) Yüzdelikten fraction’a çevir (ör: 42.5% → 0.425)
            return Math.Round(fraction, 4);  // 4 ondalık hassasiyeti

        }

        public async Task<List<TimeDepositDto>> GetTimeDepositsByUserIdAsync(int userId)
        {
            var deposits = await _context.TimeDeposits
                .Include(td => td.SourceAccount)
                .Where(td => td.UserId == userId)
                .OrderByDescending(td => td.StartDate)
                .ToListAsync();
            return _mapper.Map<List<TimeDepositDto>>(deposits);
        }

        public async Task<TimeDepositDto> CreateTimeDepositAsync(CreateTimeDepositDto dto, int userId)
        {
            var sourceAccount = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == dto.SourceAccountId && a.UserId == userId);

            if (sourceAccount == null)
                throw new InvalidOperationException("Kaynak hesap bulunamadı veya kullanıcıya ait değil.");

            if (sourceAccount.Balance < dto.Amount)
                throw new InvalidOperationException("Kaynak hesapta yeterli bakiye yok.");

            // Basit faiz hesaplaması
            var annualInterestRate = await GetAnnualInterestRate(dto.TermInMonths);
            var startDate = DateTime.UtcNow;
            var endDate = startDate.AddMonths(dto.TermInMonths);
            var interestAmount = dto.Amount * dto.AnnualInterestRate * (dto.TermInMonths / 12.0m);
            var maturityAmount = dto.Amount + interestAmount;

            var timeDeposit = new TimeDeposit
            {
                UserId = userId,
                SourceAccountId = dto.SourceAccountId,
                PrincipalAmount = dto.Amount,
                InterestRate = dto.AnnualInterestRate,
                StartDate = startDate,
                EndDate = endDate,
                MaturityAmount = maturityAmount,
                MaturityAction = dto.MaturityAction, // Vade sonu aksiyonunu kaydetme
                IsActive = true
            };

            // Kaynak hesaptan parayı düş
            sourceAccount.Balance -= dto.Amount;
            _context.Accounts.Update(sourceAccount);

            _context.TimeDeposits.Add(timeDeposit);
            await _context.SaveChangesAsync();

            // Eager loading ile DTO'yu doğru doldur
            await _context.Entry(timeDeposit).Reference(td => td.SourceAccount).LoadAsync();

            return _mapper.Map<TimeDepositDto>(timeDeposit);
        }

        public async Task<bool> CloseDepositEarlyAsync(int depositId, int userId)
        {
            // İlgili mevduat hesabını ve paranın geri aktarılacağı kaynak hesabı bul.
            var deposit = await _context.TimeDeposits
                .Include(td => td.SourceAccount)
                .FirstOrDefaultAsync(td => td.Id == depositId && td.UserId == userId);

            // Mevduat yoksa veya kullanıcıya ait değilse işlem yapma.
            if (deposit == null)
            {
                return false;
            }

            // Mevduat zaten kapalıysa hata fırlat.
            if (!deposit.IsActive)
            {
                throw new InvalidOperationException("Bu mevduat hesabı zaten kapatılmış.");
            }

            // Anaparayı kaynak hesaba geri ekle.
            // Kaynak hesabın null olma ihtimaline karşı kontrol et.
            if (deposit.SourceAccount == null)
            {
                throw new InvalidOperationException("Mevduatın kaynak hesabı bulunamadı.");
            }
            deposit.SourceAccount.Balance += deposit.PrincipalAmount;

            // Mevduat hesabını pasif hale getir.
            deposit.IsActive = false;

            // Değişiklikleri veritabanına kaydet.
            _context.Accounts.Update(deposit.SourceAccount);
            _context.TimeDeposits.Update(deposit);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<DepositCalculationResponseDto> CalculateDeposit(DepositCalculationRequestDto dto)
        {
            var annualInterestRate = await GetAnnualInterestRate(dto.TermInMonths);
            var startDate = DateTime.UtcNow;
            var endDate = startDate.AddMonths(dto.TermInMonths);
            var interestAmount = dto.Amount * annualInterestRate * (dto.TermInMonths / 12.0m);
            var maturityAmount = dto.Amount + interestAmount;

            return new DepositCalculationResponseDto
            {
                AnnualInterestRate = annualInterestRate * 100, // Yüzde olarak döndür
                TotalInterest = interestAmount,
                MaturityAmount = maturityAmount,
                EndDate = endDate
            };
        }
    }
}