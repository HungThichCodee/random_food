using System.Net.Http.Json;
using System.Net;
using System.Text.Json.Serialization;

namespace FoodMatch.Api.Services;

public interface ICaptchaVerifier
{
    Task<bool> VerifyAsync(string? token, CancellationToken cancellationToken);
}

public sealed class TurnstileVerifier(HttpClient httpClient, IConfiguration configuration,
    IWebHostEnvironment environment) : ICaptchaVerifier
{
    public static IReadOnlySet<string> ParseAllowedHostnames(string? configured)
    {
        var hostnames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(configured)) return hostnames;

        foreach (var part in configured.Split(','))
        {
            var hostname = part.Trim();
            var labels = hostname.Split('.');
            var valid = hostname.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                (hostname.Length <= 253 && labels.Length >= 2 &&
                 !IPAddress.TryParse(hostname, out _) && labels.All(label =>
                    label.Length is >= 1 and <= 63 &&
                    char.IsAsciiLetterOrDigit(label[0]) &&
                    char.IsAsciiLetterOrDigit(label[^1]) &&
                    label.All(character => char.IsAsciiLetterOrDigit(character) || character == '-')));
            if (!valid)
                throw new InvalidOperationException(
                    "Turnstile__Hostname must contain exact hostnames separated by commas.");
            hostnames.Add(hostname);
        }

        return hostnames;
    }

    public async Task<bool> VerifyAsync(string? token, CancellationToken cancellationToken)
    {
        var secret = configuration["Turnstile:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            // Local development can omit CAPTCHA; production configuration is checked at startup.
            return environment.IsDevelopment();
        }

        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048)
            return false;

        var allowedHostnames = ParseAllowedHostnames(configuration["Turnstile:Hostname"]);
        if (allowedHostnames.Count == 0 && !environment.IsDevelopment())
            return false;

        using var request = new HttpRequestMessage(HttpMethod.Post,
            "https://challenges.cloudflare.com/turnstile/v0/siteverify")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["secret"] = secret,
                ["response"] = token
            })
        };
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var verdict = await response.Content.ReadFromJsonAsync<TurnstileVerdict>(
            cancellationToken: cancellationToken);

        if (verdict?.Success != true)
            return false;

        return allowedHostnames.Count == 0 ||
               (verdict.Hostname != null && allowedHostnames.Contains(verdict.Hostname));
    }

    private sealed class TurnstileVerdict
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("hostname")]
        public string? Hostname { get; set; }
    }
}
