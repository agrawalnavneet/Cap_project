FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY ["CocaColaB2B.Shared/CocaColaB2B.Shared.csproj", "CocaColaB2B.Shared/"]
COPY ["Services/ProductService/ProductService.Domain/ProductService.Domain.csproj", "Services/ProductService/ProductService.Domain/"]
COPY ["Services/ProductService/ProductService.Application/ProductService.Application.csproj", "Services/ProductService/ProductService.Application/"]
COPY ["Services/ProductService/ProductService.Infrastructure/ProductService.Infrastructure.csproj", "Services/ProductService/ProductService.Infrastructure/"]
COPY ["Services/ProductService/ProductService.API/ProductService.API.csproj", "Services/ProductService/ProductService.API/"]
RUN dotnet restore "Services/ProductService/ProductService.API/ProductService.API.csproj"
COPY CocaColaB2B.Shared/ CocaColaB2B.Shared/
COPY Services/ProductService/ Services/ProductService/
WORKDIR "/app/Services/ProductService/ProductService.API"
RUN dotnet publish -c Release -o /app/publish
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5302
EXPOSE 5302
ENTRYPOINT ["dotnet", "ProductService.API.dll"]
