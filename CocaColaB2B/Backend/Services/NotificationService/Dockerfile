FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# ── Stage 1: Copy .csproj files for restore (layer caching) ──
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/NotificationService/NotificationService.Domain/NotificationService.Domain.csproj", "Services/NotificationService/NotificationService.Domain/"]
COPY ["Services/NotificationService/NotificationService.Application/NotificationService.Application.csproj", "Services/NotificationService/NotificationService.Application/"]
COPY ["Services/NotificationService/NotificationService.Infrastructure/NotificationService.Infrastructure.csproj", "Services/NotificationService/NotificationService.Infrastructure/"]
COPY ["Services/NotificationService/NotificationService.API/NotificationService.API.csproj", "Services/NotificationService/NotificationService.API/"]

RUN dotnet restore "Services/NotificationService/NotificationService.API/NotificationService.API.csproj"

# ── Stage 2: Copy source and publish ──
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/NotificationService/ Services/NotificationService/

WORKDIR "/app/Services/NotificationService/NotificationService.API"
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 3: Final runtime image ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5305
EXPOSE 5305
ENTRYPOINT ["dotnet", "NotificationService.API.dll"]
