using Microsoft.AspNetCore.Mvc;
using System.Data;
using ShopApi.Services;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;

namespace ShopApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InfoController : ControllerBase
    {
        private readonly ConnectionProvider _connectionProvider;
        private readonly DataTableService _dataTableService;
        private ExceptionLogger exceptionLogger;    
        // Constructor with DI
        public InfoController(ConnectionProvider connectionProvider, DataTableService dataTableService)
        {
            _connectionProvider = connectionProvider;
            _dataTableService = dataTableService;
            exceptionLogger = new ExceptionLogger(_connectionProvider);
        }
    

        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetINFO()
        {
            try{
            var dataTable = new DataTable();
            using (var connection = _connectionProvider.GetConnection())
            {
                connection.Open();
                var query = @"
                    SELECT 
                    *
                    FROM 
                    KONTAKTINE_INFO
                    WHERE Valid = 1
                ";
                
                var command = new SqlCommand(query , connection);
                using (var adapter = new SqlDataAdapter(command))
                {
                    adapter.Fill(dataTable);
                }
            }
            var jsonResult = _dataTableService.ConvertToJson(dataTable);
            return Ok(jsonResult);

            }catch(Exception ex){
                exceptionLogger.LogException(
                                    source: "GetINFO",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                                    );
             return BadRequest("Nepavyko sukurti užsakymo");
            }
        }

        [HttpGet("delivery-methods")]
        [AllowAnonymous]
        public IActionResult GetDeliveryMethods()
        {
            try
            {
                var dataTable = new DataTable();
                using (var connection = _connectionProvider.GetConnection())
                {
                    connection.Open();
                    var query = "SELECT * FROM PristatymoBudai";
                    var command = new SqlCommand(query, connection);
                    var adapter = new SqlDataAdapter(command);
                    adapter.Fill(dataTable);
                }

                var jsonResult = _dataTableService.ConvertToJson(dataTable);
                return Ok(jsonResult);
            }
            catch (Exception ex)
            {
                exceptionLogger.LogException(
                                    source: "GetDeliveryMethods",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                                    );
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Nepavyko gauti pristatymo būdų." });
            }
        }
        [HttpGet("payment-methods")]
        [AllowAnonymous]
            public async Task<IActionResult> GetPaymentMethods()
            {
                try{
                using var connection = _connectionProvider.GetConnection();
                await connection.OpenAsync();

                var query = "SELECT ID, Pavadinimas, DeliveryPossible FROM MokejimoBudai";
                using var command = new SqlCommand(query, connection);

                var paymentMethods = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    paymentMethods.Add(new
                    {
                        ID = reader["ID"],
                        Pavadinimas = reader["Pavadinimas"],
                        DeliveryPossible = reader["DeliveryPossible"],
                        
                    });
                }

                return Ok(paymentMethods);
                }catch (Exception ex)
            {
                exceptionLogger.LogException(
                                    source: "payment-methods",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                                    );
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Nepavyko gauti pristatymo būdų." });
            }
            }



    }
}