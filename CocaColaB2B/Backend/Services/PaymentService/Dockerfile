FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# ── Stage 1: Copy only .csproj files for restore (layer caching) ──
# Shared project MUST be copied first since service projects reference it
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]

# Copy all service layer .csproj files
COPY ["Services/PaymentService/PaymentService.Domain/PaymentService.Domain.csproj", "Services/PaymentService/PaymentService.Domain/"]
COPY ["Services/PaymentService/PaymentService.Application/PaymentService.Application.csproj", "Services/PaymentService/PaymentService.Application/"]
COPY ["Services/PaymentService/PaymentService.Infrastructure/PaymentService.Infrastructure.csproj", "Services/PaymentService/PaymentService.Infrastructure/"]
COPY ["Services/PaymentService/PaymentService.API/PaymentService.API.csproj", "Services/PaymentService/PaymentService.API/"]

# Restore — resolves all NuGet + project references
RUN dotnet restore "Services/PaymentService/PaymentService.API/PaymentService.API.csproj"

# ── Stage 2: Copy source code and publish ──
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/PaymentService/ Services/PaymentService/

WORKDIR "/app/Services/PaymentService/PaymentService.API"
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 3: Final runtime image (minimal) ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5307
EXPOSE 5307
ENTRYPOINT ["dotnet", "PaymentService.API.dll"]
