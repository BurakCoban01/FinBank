using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.API.Services
{
    public class AccountService : IAccountService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IIbanService _ibanService;

        public AccountService(AppDbContext context, IMapper mapper, IIbanService ibanService)
        {
            _context = context;
            _mapper = mapper;
            _ibanService = ibanService;
        }

        public async Task<List<AccountDto>> GetAccountsByUserIdAsync(int userId)
        {
            var accounts = await _context.Accounts
                .Where(a => a.UserId == userId)
                .ToListAsync();

            return _mapper.Map<List<AccountDto>>(accounts);
        }

        public async Task<AccountDto> GetAccountByIdAsync(int accountId, int userId)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            return _mapper.Map<AccountDto>(account);
        }

        public async Task<AccountDto> CreateAccountAsync(CreateAccountDto createAccountDto, int userId)
        {
            var account = _mapper.Map<Account>(createAccountDto);
            account.UserId = userId;
            account.CreatedAt = DateTime.UtcNow;
            account.IsActive = true;
            
            // Generate and assign a unique IBAN
            account.Iban = await _ibanService.GenerateNewIbanAsync(account.AccountType);

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            return _mapper.Map<AccountDto>(account);
        }

        public async Task<bool> UpdateAccountAsync(int accountId, UpdateAccountDto updateAccountDto, int userId)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
                return false;

            _mapper.Map(updateAccountDto, account);

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAccountAsync(int accountId, int userId)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
                return false;

            // Soft delete: IsActive false yapılır
            account.IsActive = false;

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}