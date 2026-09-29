using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using FoodMatch.Application.DTOs.TempUser;

namespace FoodMatch.Api.Services;

public interface IJwtTokenGenerator
{
    string GenerateToken(TempUserDto user);
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(TempUserDto user)
    {
        var secret = _configuration["JwtSettings:Secret"];
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];

        if (string.IsNullOrEmpty(secret))
        {
            // Fallback for development if not in appsettings
            secret = "SuperSecretKeyForFoodMatchApp12345!@#"; 
        }

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("SessionToken", user.SessionToken)
        };

        var token = new JwtSecurityToken(
            issuer: issuer ?? "FoodMatchApi",
            audience: audience ?? "FoodMatchClient",
            claims: claims,
            expires: user.ExpiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
