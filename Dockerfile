# ---------- build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY DemoApi.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app /p:UseAppHost=false --no-restore

# ---------- runtime stage (small, non-root) ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app ./
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
# the aspnet image ships a non-root user; run as it (DevSecOps requirement)
USER $APP_UID
ENTRYPOINT ["dotnet", "DemoApi.dll"]
