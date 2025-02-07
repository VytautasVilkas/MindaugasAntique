# Use .NET SDK to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the project file and restore dependencies
COPY webApi/webApi.csproj ./webApi/
WORKDIR /app/webApi
RUN dotnet restore

# Copy everything from webApi folder and publish
COPY webApi/ ./  
RUN dotnet publish -c Release -o /app/published --no-self-contained

# Use the .NET runtime image for production
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/published /app/

# Set environment to Production
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose the port
EXPOSE 5000

# Run the application
ENTRYPOINT ["dotnet", "/app/webApi.dll"]



