FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/FoodMatch.Api/FoodMatch.Api.csproj", "src/FoodMatch.Api/"]
COPY ["src/FoodMatch.Application/FoodMatch.Application.csproj", "src/FoodMatch.Application/"]
COPY ["src/FoodMatch.Domain/FoodMatch.Domain.csproj", "src/FoodMatch.Domain/"]
COPY ["src/FoodMatch.Infrastructure/FoodMatch.Infrastructure.csproj", "src/FoodMatch.Infrastructure/"]
RUN dotnet restore "src/FoodMatch.Api/FoodMatch.Api.csproj"
COPY . .
WORKDIR "/src/src/FoodMatch.Api"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FoodMatch.Api.dll"]
