# Use .NET SDK to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy project files and restore dependencies
COPY webApi/*.csproj ./  
WORKDIR /app/webApi
RUN dotnet restore

# Copy everything from webApi folder and publish in Release mode
COPY webApi/ ./
RUN dotnet publish -c Release -o /app/published --no-self-contained

# Use the .NET runtime image for production
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/published .

# Set environment to Production
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose the port
EXPOSE 5000

# Run the application
ENTRYPOINT ["dotnet", "webApi.dll"]


