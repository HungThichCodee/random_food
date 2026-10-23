namespace FoodMatch.Api.Configuration;

public static class RootEnvironment
{
    public static void Load()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory != null)
        {
            var path = Path.Combine(directory.FullName, ".env");
            if (File.Exists(path) &&
                File.Exists(Path.Combine(directory.FullName, "README.md")) &&
                Directory.Exists(Path.Combine(directory.FullName, "frontend")))
            {
                foreach (var rawLine in File.ReadLines(path))
                {
                    var line = rawLine.Trim();
                    if (line.Length == 0 || line.StartsWith('#')) continue;
                    var separator = line.IndexOf('=');
                    if (separator <= 0) continue;

                    var key = line[..separator].Trim();
                    var value = line[(separator + 1)..].Trim();
                    if (value.Length >= 2 &&
                        ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
                        value = value[1..^1];

                    if (Environment.GetEnvironmentVariable(key) == null)
                        Environment.SetEnvironmentVariable(key, value);
                }
                return;
            }
            directory = directory.Parent;
        }
    }
}
