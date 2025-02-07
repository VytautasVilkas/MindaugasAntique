using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using ShopApi.Services;

[ApiController]
[Route("api/logs")]
public class LogsController : ControllerBase
{
    private readonly ConnectionProvider _connectionProvider;
        private readonly DataTableService _dataTableService;

        // Constructor with DI
        public LogsController(ConnectionProvider connectionProvider, DataTableService dataTableService)
        {
            _connectionProvider = connectionProvider;
            _dataTableService = dataTableService;
        }


        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> ReceiveLogs([FromBody] List<LogEntry> logs)
        {
            if (logs == null || logs.Count == 0)
            {
                return BadRequest("No logs received.");
            }

            try
            {
        var sessionId = Request.Cookies["SESSION_ID"] ?? Request.Cookies["GUEST_SESSION_ID"];
        if (string.IsNullOrEmpty(sessionId))
        {
            return BadRequest(new { message = "No valid session found (SESSION_ID or GUEST_SESSION_ID)." });
        }

                var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
                await InsertLogsToDatabase(logs, clientIp, sessionId);

                return Ok(new { message = "Logs saved successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving logs: {ex.Message}");
                return StatusCode(500, new { error = "Failed to save logs." });
            }
        }

            private async Task InsertLogsToDatabase(List<LogEntry> logs, string clientIp, string sessionId)
            {
                using (var connection = _connectionProvider.GetConnection())
                {
                    await connection.OpenAsync();

                    foreach (var log in logs)
                    {
                        var command = new SqlCommand(
                            "INSERT INTO Logs (Level, Message, Timestamp, UserAgent, Url, AdditionalData, SessionId, ClientIp) " +
                            "VALUES (@Level, @Message, @Timestamp, @UserAgent, @Url, @AdditionalData, @SessionId, @ClientIp)",
                            connection);

                        command.Parameters.AddWithValue("@Level", log.Level);
                        command.Parameters.AddWithValue("@Message", log.Message);
                        command.Parameters.AddWithValue("@Timestamp", log.Timestamp);
                        command.Parameters.AddWithValue("@UserAgent", log.UserAgent ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Url", log.Url ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@AdditionalData", log.AdditionalData != null ? JsonConvert.SerializeObject(log.AdditionalData) : (object)DBNull.Value);
                        command.Parameters.AddWithValue("@SessionId", sessionId);
                        command.Parameters.AddWithValue("@ClientIp", clientIp ?? (object)DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                    }
                }
            }


            public class LogEntry
            {
                public string Level { get; set; }
                public string Message { get; set; }
                public string Timestamp { get; set; }
                public string UserAgent { get; set; }
                public string Url { get; set; }
                public Dictionary<string, object> AdditionalData { get; set; }
            }


}
