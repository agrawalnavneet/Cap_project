FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# ── Stage 1: Restore (layer-cached) ──────────────────────────────────────────
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Gateway/Gateway.csproj", "Gateway/"]
RUN dotnet restore "Gateway/Gateway.csproj"

# ── Stage 2: Build & publish ──────────────────────────────────────────────────
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Gateway/ Gateway/
WORKDIR "/app/Gateway"
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "Gateway.dll"]
