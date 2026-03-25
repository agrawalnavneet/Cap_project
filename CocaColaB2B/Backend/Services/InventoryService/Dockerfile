FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/InventoryService/InventoryService.Domain/InventoryService.Domain.csproj", "Services/InventoryService/InventoryService.Domain/"]
COPY ["Services/InventoryService/InventoryService.Application/InventoryService.Application.csproj", "Services/InventoryService/InventoryService.Application/"]
COPY ["Services/InventoryService/InventoryService.Infrastructure/InventoryService.Infrastructure.csproj", "Services/InventoryService/InventoryService.Infrastructure/"]
COPY ["Services/InventoryService/InventoryService.API/InventoryService.API.csproj", "Services/InventoryService/InventoryService.API/"]
RUN dotnet restore "Services/InventoryService/InventoryService.API/InventoryService.API.csproj"
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/InventoryService/ Services/InventoryService/
WORKDIR "/app/Services/InventoryService/InventoryService.API"
RUN dotnet publish -c Release -o /app/publish
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5304
EXPOSE 5304
ENTRYPOINT ["dotnet", "InventoryService.API.dll"]
