# Docker context must be repository root (Render default: ".")
# Dockerfile Path on Render: backend/HoltelCentrel.Api/Dockerfile  OR  ./Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/HoltelCentrel.Api/HoltelCentrel.Api.csproj backend/HoltelCentrel.Api/
RUN dotnet restore backend/HoltelCentrel.Api/HoltelCentrel.Api.csproj

COPY backend/HoltelCentrel.Api/ backend/HoltelCentrel.Api/
RUN dotnet publish backend/HoltelCentrel.Api/HoltelCentrel.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

CMD ["dotnet", "HoltelCentrel.Api.dll"]
