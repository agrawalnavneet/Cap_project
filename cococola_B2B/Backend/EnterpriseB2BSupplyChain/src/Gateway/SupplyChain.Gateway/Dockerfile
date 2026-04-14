FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

RUN echo "cache bypass 5"
COPY . .
RUN dotnet publish "Gateway/SupplyChain.Gateway/SupplyChain.Gateway.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SupplyChain.Gateway.dll"]
# Cache bypass 1
