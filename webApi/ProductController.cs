using Microsoft.AspNetCore.Mvc;
using System.Data;
using ShopApi.Services;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ShopApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly ConnectionProvider _connectionProvider;
        private readonly DataTableService _dataTableService;
        private ExceptionLogger exceptionLogger;
        // Constructor with DI
        public ProductController(ConnectionProvider connectionProvider, DataTableService dataTableService)
        {
            _connectionProvider = connectionProvider;
            _dataTableService = dataTableService;
            exceptionLogger = new ExceptionLogger(_connectionProvider);
        }

        // GET: api/product
                [HttpGet()]
[AllowAnonymous]
public IActionResult GetProducts(string? search = null, string? type = null)
{
    try
    {
        var dataTable = new DataTable();
        using (var connection = _connectionProvider.GetConnection())
        {
            connection.Open();

            // Normalize and tokenize the search input
            List<string> searchTokens = new List<string>();
            if (!string.IsNullOrEmpty(search))
            {
                search = search
                    .Replace("š", "s")
                    .Replace("Š", "S")
                    .Replace("ž", "z")
                    .Replace("Ž", "Z")
                    .Replace("č", "c")
                    .Replace("Č", "C")
                    .Trim();

                searchTokens = search.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
            }

            // Base query
            var query = @"
                SELECT 
                    p.PRK_ID,
                    p.PRK_KODAS,
                    p.PRK_PAVADINIMAS,
                    p.PRK_KAINA,
                    p.PRK_APRASYMAS,
                    p.PRK_NUOLAIDA,
                    n.IMG_DATA AS IMG_DATA
                FROM 
                    Prekes p
                INNER JOIN 
                    PREKIU_NUOTRAUKOS n ON p.PRK_ID = n.PRK_ID AND n.IMG_IS_MAIN = 1
                WHERE 
                PRK_Online = 1
                 AND   (1 = 1)";

            // Add tokenized search conditions
            if (searchTokens.Count > 0)
            {
                var conditions = new List<string>();
                for (int i = 0; i < searchTokens.Count; i++)
                {
                    conditions.Add($@"
                        (
                            p.PRK_PAVADINIMAS COLLATE Latin1_General_CI_AI LIKE '%' + @search{i} + '%' OR
                            p.PRK_KODAS COLLATE Latin1_General_CI_AI LIKE '%' + @search{i} + '%' OR
                            p.PRK_APRASYMAS COLLATE Latin1_General_CI_AI LIKE '%' + @search{i} + '%'
                        )");
                }
                query += " AND (" + string.Join(" AND ", conditions) + ")";
            }

            // Add type filtering if provided
            if (!string.IsNullOrEmpty(type))
            {
                var typeIds = type.Split(',');
                query += " AND (p.PRK_TYPE_ID IN (" + string.Join(",", typeIds.Select((id, index) => $"@type{index}")) + "))";
            }

            using (var command = new SqlCommand(query, connection))
            {
                // Add search token parameters
                for (int i = 0; i < searchTokens.Count; i++)
                {
                    command.Parameters.AddWithValue($"@search{i}", searchTokens[i]);
                }

                // Add type parameters dynamically
                if (!string.IsNullOrEmpty(type))
                {
                    var typeIds = type.Split(',');
                    for (int i = 0; i < typeIds.Length; i++)
                    {
                        command.Parameters.AddWithValue($"@type{i}", int.Parse(typeIds[i]));
                    }
                }

                using (var adapter = new SqlDataAdapter(command))
                {
                    adapter.Fill(dataTable);
                }
            }
        }

        var jsonResult = _dataTableService.ConvertToJson(dataTable);
        return Ok(jsonResult);
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException("GetProducts", ex.Message, ex.StackTrace);
        return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Laikinai funkcija neveikia" });
    }
}





        [HttpGet("productTypes")]
        [AllowAnonymous]
        public IActionResult GetProductTypes()
        {
            try
            {
                var dataTable = new DataTable();
                using (var connection = _connectionProvider.GetConnection())
                {
                    connection.Open();
                    var query = "SELECT PT_ID, PT_TYPE FROM PREKES_TIPAS";
                    var command = new SqlCommand(query, connection);

                    using (var adapter = new SqlDataAdapter(command))
                    {
                        adapter.Fill(dataTable);
                    }
                }

                var jsonResult = _dataTableService.ConvertToJson(dataTable);
                return Ok(jsonResult);
            }
            catch (Exception ex)
            {
                exceptionLogger.LogException("GetProductTypes", ex.Message, ex.StackTrace);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to fetch product types." });
            }
        }

        [HttpGet("{id}")]
         [AllowAnonymous]
        public IActionResult GetProduct(int id)
        {
            try{
            var dataTable = new DataTable();
            using (var connection = _connectionProvider.GetConnection())
            {
                connection.Open();
                var query = @"
                        SELECT 
                            PREKES.PRK_ID,
                            PREKES.PRK_KODAS,
                            PREKES.PRK_PAVADINIMAS,
                            PREKES.PRK_KAINA,
                            PREKES.PRK_APRASYMAS,
                            PREKES.PRK_NUOLAIDA,
                            n.IMG_DATA AS IMG_DATA
                        FROM 
                            PREKES
                        INNER JOIN 
                            PREKIU_NUOTRAUKOS n ON PREKES.PRK_ID = n.PRK_ID AND n.IMG_IS_MAIN = 1
                        WHERE
                            PREKES.PRK_ID = @PRK_ID AND PRK_ONLINE = 1;

                ";
                
                var command = new SqlCommand(query , connection);
                command.Parameters.AddWithValue("@PRK_ID", id);
                using (var adapter = new SqlDataAdapter(command))
                {
                    adapter.Fill(dataTable);
                }
            }
            var jsonResult = _dataTableService.ConvertToJson(dataTable);
            return Ok(jsonResult);

            }catch(Exception ex){
                exceptionLogger.LogException(
                                source: "GetProduct",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
                return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Atsiprašome bet šis puslapis laikinai neveikia." });


            }
        }
            [HttpGet("Nuotraukos/{id}")]
            [AllowAnonymous]
            public IActionResult GetProductImage(int id)
            {   
            try{
            var dataTable = new DataTable();
            using (var connection = _connectionProvider.GetConnection())
            {
                connection.Open();
                var query = @"
                    SELECT 
                        IMG_DATA
                    FROM 
                        PREKIU_NUOTRAUKOS
                    WHERE 
                        PRK_ID = @PRK_ID";

                var command = new SqlCommand(query , connection);
                command.Parameters.AddWithValue("@PRK_ID", id);
                using (var adapter = new SqlDataAdapter(command))
                {
                    adapter.Fill(dataTable);
                }
            }
            var jsonResult = _dataTableService.ConvertToJson(dataTable);
            return Ok(jsonResult);
            }catch(Exception ex){
            exceptionLogger.LogException(
                                source: "GetProductImage",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
            return BadRequest(new {message = "Atsiprašome bet šis puslapis laikinai neveikia." });

            }

        }
    }
}


