using Microsoft.AspNetCore.Mvc;
using System.Data;
using ShopApi.Services;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.SignalR;

[ApiController]
[Route("api/[controller]")]
public class StockController : ControllerBase
{
    private readonly ConnectionProvider _connectionProvider;
    private readonly DataTableService _dataTableService;
    
    private ExceptionLogger exceptionLogger;
    public StockController(
        ConnectionProvider connectionProvider,
        DataTableService dataTableService)
    {
        _connectionProvider = connectionProvider;
        _dataTableService = dataTableService;
        exceptionLogger = new ExceptionLogger(_connectionProvider);
    }

    [HttpPost("setStock")]
    public IActionResult SetStock(int PRK_ID)
    {
        return NotFound(new {message= "laikinai neveikia"});
    // try
    // {
    //     using (var connection = _connectionProvider.GetConnection())
    //     {
    //         connection.Open();
    //         var query = "UPDATE PREKES_STOCK SET PRK_KIEKIS = PRK_KIEKIS + 1 WHERE PRK_ID = @PRK_ID";

    //         using (var command = new SqlCommand(query, connection))
    //         {
    //             command.Parameters.AddWithValue("@PRK_ID", PRK_ID); 

    //             int rowsAffected = command.ExecuteNonQuery();

    //             if (rowsAffected > 0)
    //             {
    //                 return Ok(new { message = "stock" });
    //             }
    //             else
    //             {
    //                 return NotFound(new { message = "No record found for the given PRK_ID." });
    //             }
    //         }
    //     }
    // }
    // catch (Exception ex)
    // {
    //     exceptionLogger.LogException(
    //                             source: "GetAllProducts",
    //                             message: ex.Message,
    //                             stackTrace: ex.StackTrace
    //                         );
    //     return StatusCode(500, new { message = "An error occurred.", error = ex.Message });
    // }
}
    [HttpGet("getStock")]
    public IActionResult GetStock()
    {
    try
    {
        var dataTable = new DataTable();
        using (var connection = _connectionProvider.GetConnection())
        {
            connection.Open();
            var query = @"
            SELECT 
            ps.PRK_ID,
            ps.PRK_KIEKIS - ISNULL(SUM(CASE 
                                        WHEN u.Status IN (0, 1) THEN ut.Quantity 
                                        ELSE 0 
                                        END), 0) AS PRK_KIEKIS
            FROM 
                PREKES_STOCK ps
            INNER JOIN 
                PREKES p ON ps.PRK_ID = p.PRK_ID AND p.PRK_ONLINE = 1
            LEFT JOIN 
                UZSAKYMAI_TURINYS ut ON p.PRK_KODAS = ut.PRK_KODAS
            LEFT JOIN 
                UZSAKYMAI u ON ut.UZS_ID = u.UZS_ID
            GROUP BY 
                ps.PRK_ID, ps.PRK_KIEKIS;";
        


            using (var command = new SqlCommand(query, connection))
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
       exceptionLogger.LogException(
                                source: "GetStock",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
        return StatusCode(500, new { message = "Nepavyko gauti prekiu kiekio"});
    }
}
[HttpGet("checkStock/{prkId}")]
public IActionResult CheckStock(int prkId)
{
    try
    {
        var dataTable = new DataTable();
        using (var connection = _connectionProvider.GetConnection())
        {
            connection.Open();
            var query = @"
                SELECT 
                ps.PRK_ID,
                ps.PRK_KIEKIS - ISNULL(SUM(CASE 
                                            WHEN u.Status IN (0, 1) THEN ut.Quantity 
                                            ELSE 0 
                                            END), 0) AS PRK_KIEKIS
                    FROM 
                        PREKES_STOCK ps
                    INNER JOIN 
                        PREKES p ON ps.PRK_ID = p.PRK_ID AND p.PRK_ONLINE = 1 
                    LEFT JOIN 
                        UZSAKYMAI_TURINYS ut ON p.PRK_KODAS = ut.PRK_KODAS
                    LEFT JOIN 
                        UZSAKYMAI u ON ut.UZS_ID = u.UZS_ID
                    WHERE 
                        ps.PRK_ID = @PRK_ID
                    GROUP BY 
                        ps.PRK_ID, ps.PRK_KIEKIS;";


            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@PRK_ID", prkId);

                using (var adapter = new SqlDataAdapter(command))
                {
                    adapter.Fill(dataTable);
                }
            }
        }
        if (dataTable.Rows.Count > 0)
        {
            var jsonResult = _dataTableService.ConvertToJson(dataTable);
            return Ok(jsonResult);
        }
        else
        {   
            exceptionLogger.LogException(
                                source: "CheckStock",
                                message:"dataTable.Rows.Count > 0",
                                stackTrace: ""
                            );
            return NotFound(new { message = "Nerastas prekiu kiekis" });
        }
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException(
                                source: "CheckStock",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}

}


