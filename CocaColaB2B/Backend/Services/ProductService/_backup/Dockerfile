FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/ProductService/ProductService.csproj", "Services/ProductService/"]
RUN dotnet restore "Services/ProductService/ProductService.csproj"
COPY . .
WORKDIR "/src/Services/ProductService"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ProductService.dll"]
