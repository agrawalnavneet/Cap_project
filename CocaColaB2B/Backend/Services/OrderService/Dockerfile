FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy generic shared 
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]

# Copy microservice projects
COPY ["Services/OrderService/OrderService.Domain/OrderService.Domain.csproj", "Services/OrderService/OrderService.Domain/"]
COPY ["Services/OrderService/OrderService.Application/OrderService.Application.csproj", "Services/OrderService/OrderService.Application/"]
COPY ["Services/OrderService/OrderService.Infrastructure/OrderService.Infrastructure.csproj", "Services/OrderService/OrderService.Infrastructure/"]
COPY ["Services/OrderService/OrderService.API/OrderService.API.csproj", "Services/OrderService/OrderService.API/"]

RUN dotnet restore "Services/OrderService/OrderService.API/OrderService.API.csproj"

COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/OrderService/ Services/OrderService/

WORKDIR "/app/Services/OrderService/OrderService.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5303
EXPOSE 5303
ENTRYPOINT ["dotnet", "OrderService.API.dll"]
