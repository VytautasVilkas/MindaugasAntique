# Use .NET SDK to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files
COPY webApi/*.csproj ./webApi/
WORKDIR /app/webApi
RUN dotnet restore

# Copy everything and publish in Release mode
COPY webApi/. .
RUN dotnet publish -c Release -o /app/published --no-self-contained

# Use the smaller .NET runtime image for production
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/published .

# Set the environment to Production
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose the port your app runs on
EXPOSE 5000

# Run the application
ENTRYPOINT ["dotnet", "/app/MindaugasAntique.dll"]


