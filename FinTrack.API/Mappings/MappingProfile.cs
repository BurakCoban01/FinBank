using AutoMapper;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace FinTrack.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User eşlemeleri
            CreateMap<User, UserDto>();
            CreateMap<RegisterDto, User>();

            // Account eşlemeleri
            CreateMap<Account, AccountDto>();
            CreateMap<CreateAccountDto, Account>();
            CreateMap<UpdateAccountDto, Account>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Transaction eşlemeleri
            CreateMap<Transaction, TransactionDto>()
                .ForMember(dest => dest.AccountName, opt => opt.MapFrom(src => src.Account.Name))
                .ForMember(dest => dest.AccountCurrency, opt => opt.MapFrom(src => src.Account.Currency)) // eklendi
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
                .ForMember(dest => dest.CategoryColor, opt => opt.MapFrom(src => src.Category != null ? src.Category.Color : null)) // eklendi
                .AfterMap((src, dest) => {
                    if (src.Type == TransactionType.YatirimAlim || src.Type == TransactionType.YatirimSatim)
                    {
                        dest.CategoryName = "Yatırım";
                        dest.CategoryColor = "#FFC107"; // Amber rengi - daha okunaklı
                    }
                });

            CreateMap<CreateTransactionDto, Transaction>()
                .ForMember(dest => dest.TransactionDate, opt => opt.MapFrom(src => src.TransactionDate.HasValue ? src.TransactionDate.Value : System.DateTime.Now));
            CreateMap<UpdateTransactionDto, Transaction>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Category eşlemeleri
            CreateMap<Category, CategoryDto>();
            CreateMap<CreateCategoryDto, Category>();
            CreateMap<UpdateCategoryDto, Category>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // TimeDeposit Eşlemeleri
            CreateMap<TimeDeposit, TimeDepositDto>()
                .ForMember(dest => dest.SourceAccountName, opt => opt.MapFrom(src => src.SourceAccount.Name))
                .ForMember(dest => dest.InterestRate, opt => opt.MapFrom(src => src.InterestRate * 100)); // Oranı % olarak göstermek için

            CreateMap<Loan, LoanDto>()
                .ForMember(dest => dest.TargetAccountName, opt => opt.MapFrom(src => src.TargetAccount.Name))
                .ForMember(dest => dest.InterestRate, opt => opt.MapFrom(src => src.InterestRate * 100))  // % olarak gösterim
                .ForMember(dest => dest.TotalInterestPaid, opt => opt.MapFrom(src => src.TotalRepayment - src.PrincipalAmount));


        }
    }
}