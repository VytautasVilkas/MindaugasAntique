using Microsoft.Data.SqlClient;

namespace ShopApi.Services
{
    public class ConnectionProvider
    {
        private readonly string _connectionString;

        public ConnectionProvider(IConfiguration configuration)
        {   
              _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") 
                                ?? configuration.GetConnectionString("DefaultConnection") 
                                ?? throw new ArgumentNullException("No connection string found.");
        }

        public SqlConnection GetConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}
