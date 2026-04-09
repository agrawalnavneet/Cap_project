FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# ── Stage 1: Copy .csproj files for restore (layer caching) ──
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/InventoryService/InventoryService.Domain/InventoryService.Domain.csproj", "Services/InventoryService/InventoryService.Domain/"]
COPY ["Services/InventoryService/InventoryService.Application/InventoryService.Application.csproj", "Services/InventoryService/InventoryService.Application/"]
COPY ["Services/InventoryService/InventoryService.Infrastructure/InventoryService.Infrastructure.csproj", "Services/InventoryService/InventoryService.Infrastructure/"]
COPY ["Services/InventoryService/InventoryService.API/InventoryService.API.csproj", "Services/InventoryService/InventoryService.API/"]

RUN dotnet restore "Services/InventoryService/InventoryService.API/InventoryService.API.csproj"

# ── Stage 2: Copy source and publish ──
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/InventoryService/ Services/InventoryService/

WORKDIR "/app/Services/InventoryService/InventoryService.API"
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 3: Final runtime image ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5304
EXPOSE 5304
ENTRYPOINT ["dotnet", "InventoryService.API.dll"]
