FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# ── Stage 1: Copy .csproj files for restore (layer caching) ──
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/DeliveryService/DeliveryService.Domain/DeliveryService.Domain.csproj", "Services/DeliveryService/DeliveryService.Domain/"]
COPY ["Services/DeliveryService/DeliveryService.Application/DeliveryService.Application.csproj", "Services/DeliveryService/DeliveryService.Application/"]
COPY ["Services/DeliveryService/DeliveryService.Infrastructure/DeliveryService.Infrastructure.csproj", "Services/DeliveryService/DeliveryService.Infrastructure/"]
COPY ["Services/DeliveryService/DeliveryService.API/DeliveryService.API.csproj", "Services/DeliveryService/DeliveryService.API/"]

RUN dotnet restore "Services/DeliveryService/DeliveryService.API/DeliveryService.API.csproj"

# ── Stage 2: Copy source and publish ──
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/DeliveryService/ Services/DeliveryService/

WORKDIR "/app/Services/DeliveryService/DeliveryService.API"
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 3: Final runtime image ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5306
EXPOSE 5306
ENTRYPOINT ["dotnet", "DeliveryService.API.dll"]
