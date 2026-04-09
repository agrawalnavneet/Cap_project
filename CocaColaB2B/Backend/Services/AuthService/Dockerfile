FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# ── Stage 1: Copy .csproj files for restore (layer caching) ──
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/AuthService/AuthService.Domain/AuthService.Domain.csproj", "Services/AuthService/AuthService.Domain/"]
COPY ["Services/AuthService/AuthService.Application/AuthService.Application.csproj", "Services/AuthService/AuthService.Application/"]
COPY ["Services/AuthService/AuthService.Infrastructure/AuthService.Infrastructure.csproj", "Services/AuthService/AuthService.Infrastructure/"]
COPY ["Services/AuthService/AuthService.API/AuthService.API.csproj", "Services/AuthService/AuthService.API/"]

RUN dotnet restore "Services/AuthService/AuthService.API/AuthService.API.csproj"

# ── Stage 2: Copy source and publish ──
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/AuthService/ Services/AuthService/

WORKDIR "/app/Services/AuthService/AuthService.API"
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 3: Final runtime image ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5301
EXPOSE 5301
ENTRYPOINT ["dotnet", "AuthService.API.dll"]
