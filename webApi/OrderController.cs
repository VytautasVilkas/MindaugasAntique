using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using MailKitSmtpClient = MailKit.Net.Smtp.SmtpClient;
using MimeKit;
using Newtonsoft.Json;
using ShopApi.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using MailKit.Search;
using System.Reflection;
using Microsoft.VisualBasic;
namespace ShopApi.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    private readonly ConnectionProvider _connectionProvider;
    private readonly DataTableService _dataTableService;
    private ExceptionLogger exceptionLogger;
    private readonly SecretManager _secretManager;
    public OrderController(ConnectionProvider connectionProvider, DataTableService dataTableService, SecretManager secretManager)
    {
        _connectionProvider = connectionProvider;
        _dataTableService = dataTableService;
        exceptionLogger = new ExceptionLogger(_connectionProvider);
        _secretManager = secretManager;
    }





[HttpPost("/MakeNewOrder")]
[Authorize]
public async Task<IActionResult> CreateOrder([FromBody] Order orderRequest)
{
    if (orderRequest == null)
    {
        exceptionLogger.LogException(
            source: "MakeNewOrder",
            message: "Request body is null",
            stackTrace: "No stack trace"
        );
        return BadRequest("Nepavyko sukurti užsakymo");
    }

    // Extract session_id
    var sessionId = "";
    try
    {
        sessionId = User?.FindFirst("SessionId")?.Value;
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException(
            source: "MakeNewOrder",
            message: "Session_id nothing",
            stackTrace: "Session_id nothing"
        );
        return BadRequest(new { message = "Nepavyko gauti sesijos" });
    }

    if (string.IsNullOrEmpty(sessionId))
    {
        exceptionLogger.LogException(
            source: "MakeNewOrder",
            message: "Session_id nothing",
            stackTrace: "Session_id nothing"
        );
        return BadRequest(new { message = "Nerasta sesija arba baigė galioti" });
    }

    using var connection = _connectionProvider.GetConnection();
    await connection.OpenAsync();
    string userId = null;
    string EMAIL = null;

    // Fetch user ID from session
    var fetchUserIdQuery = "SELECT UserId FROM Sessions WHERE SessionId = @SessionId AND Active = 1";
    try
    {
        using (var fetchUserIdCommand = new SqlCommand(fetchUserIdQuery, connection))
        {
            fetchUserIdCommand.Parameters.AddWithValue("@SessionId", sessionId);
            using (var reader = await fetchUserIdCommand.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    userId = reader["UserId"] as string;
                }
            }
        }
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException(
            source: "fetchUserIdCommand",
            message: ex.Message,
            stackTrace: ex.StackTrace
        );
        return BadRequest(new { message = "Nerasta sesija arba baigė galioti" });
    }

    if (userId == null)
    {
        return Unauthorized(new { message = "Sesija negaliojanti arba Nerasta" });
    }
    try
    {
        var fetchUserEmail = "SELECT EMAIL FROM [USER] WHERE userId = @userId AND Activated = 1";
        using (var fetchUserEmailCommand = new SqlCommand(fetchUserEmail, connection))
        {
            fetchUserEmailCommand.Parameters.AddWithValue("@userId", userId);
            using (var reader = await fetchUserEmailCommand.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    EMAIL = reader["EMAIL"] as string;
                }
            }
        }
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException(
            source: "fetchUserEmail",
            message: ex.Message,
            stackTrace: ex.StackTrace
        );
        return BadRequest(new { message = "Nerastas Vartotojo email adresas" });
    }

    // Validate payment method
    try
    {
        var validatePaymentQuery = @"
            SELECT DeliveryPossible 
            FROM MokejimoBudai 
            WHERE ID = @PaymentMethodID";

        using (var validatePaymentCommand = new SqlCommand(validatePaymentQuery, connection))
        {
            validatePaymentCommand.Parameters.AddWithValue("@PaymentMethodID", orderRequest.PaymentMethodID);

            var deliveryPossible = (bool?)await validatePaymentCommand.ExecuteScalarAsync();

            // Check if payment method exists
            if (deliveryPossible == null)
            {
                return BadRequest(new { message = "Blogas mokėjimo būdas" });
            }
            if (orderRequest.DeliveryType == "Delivery" && deliveryPossible == false)
            {
                return BadRequest(new { message = "Negalite mokėti grynais naudojant pristatymo į namus sistemą." });
            }
        }
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException(
            source: "validatePaymentQuery",
            message: ex.Message,
            stackTrace: ex.StackTrace
        );
        return BadRequest(new { message = "Nepavyko patikrinti mokėjimo būdo." });
    }
        decimal totalPrice = 0;
        foreach (var item in orderRequest.Items)
        {
            decimal actualPrice = GetPriceFromDatabase(connection,item.ProductId);
            if (item.Price != actualPrice)
            {
               return BadRequest(new { message = $"Nesutampa prekės kaina {item.ProductId}. Perklaukite puslapi"});
            }
            totalPrice += actualPrice * item.Quantity;
        }
        if (!string.IsNullOrEmpty(orderRequest.DeliveryName))
        {
            totalPrice += orderRequest.DeliveryFee;
        }
    using var transaction = await connection.BeginTransactionAsync();
    try
    {
        var orderId = Guid.NewGuid();
        const string orderNumberPrefix = "NA";
        var insertOrderQuery = @"
            INSERT INTO UZSAKYMAI 
            (UZS_ID, SessionID, Name, Surname, UserID, Email, Phone, City, Street, House_nr, Post_code, DeliveryName, Date, Date_expires, Status, PaymentMethodId, TotalPrice) 
            OUTPUT INSERTED.ID
            VALUES 
            (@UZS_ID, @SessionID, @Name, @Surname, @UserID, @Email, @Phone, @City, @Street, @House_nr, @Post_code, @DeliveryName, @Date, @Date_expires, @Status, @PaymentMethodId, @TotalPrice)";

        int newOrderId;
        using (var orderCommand = new SqlCommand(insertOrderQuery, connection, (SqlTransaction)transaction))
        {
            orderCommand.Parameters.AddWithValue("@UZS_ID", orderId);
            orderCommand.Parameters.AddWithValue("@SessionID", sessionId);
            orderCommand.Parameters.AddWithValue("@Name", orderRequest.Name ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@Surname", orderRequest.Surname ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@UserID", userId ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@Email", EMAIL ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@Phone", orderRequest.Phone ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@City", orderRequest.City ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@Street", orderRequest.Street ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@House_nr", orderRequest.HouseNumber ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@Post_code", orderRequest.PostCode ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@DeliveryName", orderRequest.DeliveryName ?? (object)DBNull.Value);
            orderCommand.Parameters.AddWithValue("@Date", DateTime.UtcNow);
            orderCommand.Parameters.AddWithValue("@Date_expires", DateTime.UtcNow.AddHours(24));
            orderCommand.Parameters.AddWithValue("@Status", 0);
            orderCommand.Parameters.AddWithValue("@PaymentMethodId", orderRequest.PaymentMethodID);
            orderCommand.Parameters.AddWithValue("@TotalPrice", totalPrice);
            newOrderId = (int)await orderCommand.ExecuteScalarAsync();
        }
        string formattedDate = DateTime.UtcNow.ToString("yyyyMMdd"); 
        string newInvoiceNumber = $"{orderNumberPrefix}{formattedDate}{newOrderId:D6}";
        var updateOrderQuery = "UPDATE UZSAKYMAI SET UZS_NR = @UZS_NR WHERE ID = @ID";
        using (var updateCommand = new SqlCommand(updateOrderQuery, connection, (SqlTransaction)transaction))
        {
            updateCommand.Parameters.AddWithValue("@UZS_NR", newInvoiceNumber);
            updateCommand.Parameters.AddWithValue("@ID", newOrderId);
            await updateCommand.ExecuteNonQueryAsync();
        }
        foreach (var item in orderRequest.Items)
        {
            if (item.Quantity <=0){
                exceptionLogger.LogException(
                    source: "MakeNewOrder",
                    message: "Kažkodel kiekis < 0",
                    stackTrace: "orderRequest.Items"
                );
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Nepavyko sukurti užsakymo, Prekės kiekis neatitinka" });
            }
            var insertItemQuery = @"
                INSERT INTO UZSAKYMAI_TURINYS 
                ( UZS_ID, PRK_KODAS, PRK_PAVADINIMAS, Quantity, Price, Subtotal) 
                VALUES 
                ( @UZS_ID, @PRK_KODAS, @PRK_PAVADINIMAS, @Quantity, @Price, @Subtotal)";
            using var itemCommand = new SqlCommand(insertItemQuery, connection, (SqlTransaction)transaction);
            itemCommand.Parameters.AddWithValue("@UZS_ID", orderId);
            itemCommand.Parameters.AddWithValue("@PRK_KODAS", item.ProductId ?? (object)DBNull.Value);
            itemCommand.Parameters.AddWithValue("@PRK_PAVADINIMAS", item.ProductName ?? (object)DBNull.Value);
            itemCommand.Parameters.AddWithValue("@Quantity", item.Quantity);
            itemCommand.Parameters.AddWithValue("@Price", item.Price);
            itemCommand.Parameters.AddWithValue("@Subtotal", item.Price * item.Quantity);
            await itemCommand.ExecuteNonQueryAsync();
        }
        if (!string.IsNullOrEmpty(orderRequest.DeliveryName))
        {
            var deliveryItemQuery = @"
                INSERT INTO UZSAKYMAI_TURINYS 
                ( UZS_ID, PRK_KODAS, PRK_PAVADINIMAS, Quantity, Price, Subtotal) 
                VALUES 
                ( @UZS_ID, @PRK_KODAS, @PRK_PAVADINIMAS, @Quantity, @Price, @Subtotal)";
            using var deliveryCommand = new SqlCommand(deliveryItemQuery, connection, (SqlTransaction)transaction);
            deliveryCommand.Parameters.AddWithValue("@UZS_ID", orderId);
            deliveryCommand.Parameters.AddWithValue("@PRK_KODAS", "DELIVERY");
            deliveryCommand.Parameters.AddWithValue("@PRK_PAVADINIMAS", orderRequest.DeliveryName);
            deliveryCommand.Parameters.AddWithValue("@Quantity", 1);
            deliveryCommand.Parameters.AddWithValue("@Price", orderRequest.DeliveryFee);
            deliveryCommand.Parameters.AddWithValue("@Subtotal", orderRequest.DeliveryFee);
            await deliveryCommand.ExecuteNonQueryAsync();
        }

        var pdfFile = await GenerateProFormaInvoice(newInvoiceNumber, userId);
        if (pdfFile == null)
        await SendThankYouEmail(EMAIL, newInvoiceNumber, pdfFile);
        await transaction.CommitAsync();
        return Ok(new { Message = "Užsakymas sėkmingai sukurtas", Uzsakymo_ID = orderId });
    }
    catch (Exception ex)
    {
        exceptionLogger.LogException(
            source: "MakeNewOrder",
            message: ex.Message,
            stackTrace: ex.StackTrace
        );
        await transaction.RollbackAsync();
        return StatusCode(500, new { message = "Nepavyko sukurti užsakymo, pabandykite vėliau" });
    }
    finally
    {
        await connection.CloseAsync();
    }
}       
        // nuolaida paskaiciuot+
        private decimal GetPriceFromDatabase(SqlConnection connection, string itemId)
        {
            try
            {
                // Retrieve both price and discount percentage
                string query = "SELECT PRK_KAINA, PRK_NUOLAIDA FROM PREKES WHERE PRK_KODAS = @ItemId";
                
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@ItemId", itemId);
                    
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            
                            decimal price = reader.GetDecimal(0); // PRK_KAINA
                            
                            int discount = reader.IsDBNull(1) ? 0 : reader.GetInt32(1);
                            Console.WriteLine("kaina: "+ price+ " nuolaida: "+ discount);

                            if (discount <= 0)
                            {
                                return price;
                            }
                            decimal actualPrice = price - (price * discount / 100);
                            return actualPrice;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                exceptionLogger.LogException(
                    source: "GetPriceFromDatabase",
                    message: ex.Message,
                    stackTrace: ex.StackTrace
                );
            }

            return 0; // Return 0 in case of error
        }




        [HttpGet("/GetUserOrders")]
        [Authorize]
        public async Task<IActionResult> GetUserOrders(string? search = null, string? startDate = null, string? endDate = null, string? status = null)
        {
            try
            {
                var sessionId = User?.FindFirst("SessionId")?.Value;
                if (string.IsNullOrEmpty(sessionId))
                {
                    return Unauthorized(new { message = "Sesijos ID nerastas arba baigė galioti." });
                }

                using var connection = _connectionProvider.GetConnection();
                await connection.OpenAsync();

                string userId;
                var fetchUserIdQuery = "SELECT UserId FROM Sessions WHERE SessionId = @SessionId AND Active = 1";
                using (var fetchUserIdCommand = new SqlCommand(fetchUserIdQuery, connection))
                {
                    fetchUserIdCommand.Parameters.AddWithValue("@SessionId", sessionId);
                    using (var reader = await fetchUserIdCommand.ExecuteReaderAsync())
                    {
                        if (!await reader.ReadAsync())
                        {
                            return Unauthorized(new { message = "Sesija negaliojanti arba nerasta." });
                        }

                        userId = reader["UserId"] as string;
                    }
                }

                int? statusCode = GetStatusCode(status);

                var ordersQuery = @"
                    SELECT 
                        u.UZS_NR, u.Date, u.DeliveryName, u.Status, u.TotalPrice,
                        ut.PRK_KODAS, ut.PRK_PAVADINIMAS, ut.Quantity, ut.Price, ut.Subtotal
                    FROM 
                        UZSAKYMAI u
                    LEFT JOIN 
                        UZSAKYMAI_TURINYS ut ON u.UZS_ID = ut.UZS_ID
                    WHERE 
                        u.UserID = @UserId";

                // Append filters
                if (!string.IsNullOrEmpty(search))
                {
                    ordersQuery += " AND (u.UZS_NR LIKE '%' + @Search + '%')";
                }

                if (!string.IsNullOrEmpty(startDate))
                {
                    ordersQuery += " AND u.Date >= @StartDate";
                }

                if (!string.IsNullOrEmpty(endDate))
                {
                    ordersQuery += " AND u.Date < DATEADD(day, 1, @EndDate)"; // Include the full end date
                }

                if (statusCode.HasValue)
                {
                    ordersQuery += " AND u.Status = @Status";
                }

                ordersQuery += " ORDER BY u.Date DESC";

                var orders = new List<OrderDTO>();
                using (var fetchOrdersCommand = new SqlCommand(ordersQuery, connection))
                {
                    fetchOrdersCommand.Parameters.AddWithValue("@UserId", userId);

                    if (!string.IsNullOrEmpty(search))
                    {
                        fetchOrdersCommand.Parameters.AddWithValue("@Search", search);
                    }
                    if (!string.IsNullOrEmpty(startDate))
                    {
                        fetchOrdersCommand.Parameters.AddWithValue("@StartDate", DateTime.Parse(startDate));
                    }
                    if (!string.IsNullOrEmpty(endDate))
                    {
                        fetchOrdersCommand.Parameters.AddWithValue("@EndDate", DateTime.Parse(endDate));
                    }
                    if (statusCode.HasValue)
                    {
                        fetchOrdersCommand.Parameters.AddWithValue("@Status", statusCode.Value);
                    }

                    using (var reader = await fetchOrdersCommand.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var orderNumber = reader["UZS_NR"].ToString();
                            var existingOrder = orders.FirstOrDefault(o => o.OrderNumber == orderNumber);
                            if (existingOrder == null)
                            {
                                existingOrder = new OrderDTO
                                {
                                    OrderNumber = orderNumber,
                                    OrderDate = Convert.ToDateTime(reader["Date"]),
                                    DeliveryName = reader["DeliveryName"].ToString(),
                                    Status = GetStatusName(Convert.ToInt32(reader["Status"])),
                                    TotalPrice = Convert.ToDecimal(reader["TotalPrice"]),
                                    Items = new List<OrderItemDTO>()
                                };
                                orders.Add(existingOrder);
                            }

                            if (!reader.IsDBNull(reader.GetOrdinal("PRK_KODAS")))
                            {
                                existingOrder.Items.Add(new OrderItemDTO
                                {
                                    ProductCode = reader["PRK_KODAS"].ToString(),
                                    ProductName = reader["PRK_PAVADINIMAS"].ToString(),
                                    Quantity = Convert.ToInt32(reader["Quantity"]),
                                    Price = Convert.ToDecimal(reader["Price"]),
                                    Subtotal = Convert.ToDecimal(reader["Subtotal"])
                                });
                            }
                        }
                    }
                }

                return Ok(orders);
            }
            catch (Exception ex)
            {
                exceptionLogger.LogException("GetUserOrders", ex.Message, ex.StackTrace);
                return StatusCode(500, new { message = "Nepavyko gauti užsakymų." });
            }
        }
        public async Task<byte[]> GenerateProFormaInvoice(string orderNumber, string userId)
            {
                using var connection = _connectionProvider.GetConnection();
                await connection.OpenAsync();

                // Fetch Order
                var order = await FetchOrder(connection, orderNumber, userId);
                if (order == null)
                {
                    throw new KeyNotFoundException("Užsakymas nerastas.");
                }

                if (order.StatusId == 1)
                {
                    throw new InvalidOperationException("Užsakymas buvo apmokėtas.");
                }

                if (order.StatusId == 2)
                {
                    throw new InvalidOperationException("Užsakymas buvo panaikintas.");
                }

                // Fetch Seller
                var seller = await FetchSeller(connection);

                // Fetch Seller Logo
                byte[] imgdata = GetImageFromDatabase(1);

                // Generate PDF
                return InvoiceGenerator.GenerateProformInvoice(order, seller, imgdata);
            }
        public async Task<byte[]> GenerateInvoice(string invoice, string userId)
            {
            using var connection = _connectionProvider.GetConnection();
            await connection.OpenAsync();

                // Fetch Order
                Console.Write("saskaiata: "+invoice);
                var Invoice = await FetchInvoice(connection, invoice, userId);
            

                var seller = await FetchSeller(connection);

                byte[] imgdata = GetImageFromDatabase(1);

                // Generate PDF
                return InvoiceGenerator.GenerateInvoice(Invoice, seller, imgdata);
            }

        // [HttpGet("/GetProFormaInvoice/{orderNumber}")]

        // [Authorize]
        // public async Task<IActionResult> GetProFormaInvoice(string orderNumber)
        // {
        //     try
        //     {
        //         // Fetch the specific order based on the order number
        //         var sessionId = User?.FindFirst("SessionId")?.Value;
        //         if (string.IsNullOrEmpty(sessionId))
        //         {
        //             return Unauthorized(new { message = "Sesijos ID nerastas arba baigė galioti." });
        //         }

        //         using var connection = _connectionProvider.GetConnection();
        //         await connection.OpenAsync();

        //         // Get UserId from SessionId
        //         string userId;
        //         var fetchUserIdQuery = "SELECT UserId FROM Sessions WHERE SessionId = @SessionId AND Active = 1";
        //         using (var fetchUserIdCommand = new SqlCommand(fetchUserIdQuery, connection))
        //         {
        //             fetchUserIdCommand.Parameters.AddWithValue("@SessionId", sessionId);
        //             using (var reader = await fetchUserIdCommand.ExecuteReaderAsync())
        //             {
        //                 if (!await reader.ReadAsync())
        //                 {
        //                     return Unauthorized(new { message = "Sesija negaliojanti arba nerasta." });
        //                 }
        //                 userId = reader["UserId"] as string;
        //             }
        //         }

        //         // Fetch Order
        //         OrderDTO order = null;
                
        //         var fetchOrderQuery = @"
        //             SELECT 
        //                 u.UZS_NR, u.Date, u.DeliveryName, u.Status, u.TotalPrice,u.Name,u.Surname,u.City,u.Street,u.House_nr,u.Post_code,
        //                 u.status,
        //                 ut.PRK_KODAS, ut.PRK_PAVADINIMAS, ut.Quantity, ut.Price, ut.Subtotal
        //             FROM 
        //                 UZSAKYMAI u
        //             LEFT JOIN 
        //                 UZSAKYMAI_TURINYS ut ON u.UZS_ID = ut.UZS_ID
        //             WHERE 
        //                 u.UZS_NR = @OrderNumber AND u.UserID = @UserId" ;

        //         using (var fetchOrderCommand = new SqlCommand(fetchOrderQuery, connection))
        //         {
        //             fetchOrderCommand.Parameters.AddWithValue("@OrderNumber", orderNumber);
        //             fetchOrderCommand.Parameters.AddWithValue("@UserId", userId);
        //             using (var reader = await fetchOrderCommand.ExecuteReaderAsync())
        //             {
        //                 while (await reader.ReadAsync())
        //                 {
        //                     if (order == null)
        //                     {
        //                         order = new OrderDTO
        //                         {
        //                             OrderNumber = orderNumber,
        //                             OrderDate = Convert.ToDateTime(reader["Date"]),
        //                             DeliveryName = reader["DeliveryName"].ToString(),
        //                             StatusId = Convert.ToInt32(reader["Status"]),
        //                             Status = GetStatusName(Convert.ToInt32(reader["Status"])),
        //                             Name = reader["Name"].ToString(),
        //                             Surname = reader["Surname"].ToString(),
        //                             City = reader["City"].ToString(),
        //                             Street = reader["Street"].ToString(),
        //                             HouseNumber = reader["House_nr"].ToString(),
        //                             PostCode = reader["Post_code"].ToString(),
        //                             TotalPrice = Convert.ToDecimal(reader["TotalPrice"]),
        //                             Items = new List<OrderItemDTO>()
        //                         };
        //                     }

        //                     if (!reader.IsDBNull(reader.GetOrdinal("PRK_KODAS")))
        //                     {
        //                         order.Items.Add(new OrderItemDTO
        //                         {
        //                             ProductCode = reader["PRK_KODAS"].ToString(),
        //                             ProductName = reader["PRK_PAVADINIMAS"].ToString(),
        //                             Quantity = Convert.ToInt32(reader["Quantity"]),
        //                             Price = Convert.ToDecimal(reader["Price"]),
        //                             Subtotal = Convert.ToDecimal(reader["Subtotal"])
        //                         });
        //                     }
        //                 }
        //             }
        //         }

        //         if (order == null)
        //         {
        //             return NotFound(new { message = "Užsakymas nerastas." });
        //         }
        //         if (order.StatusId == 1)
        //         {
        //             return Conflict(new { code = "ORDER_PAID", message = "Užsakymas buvo sėkmingai apmokėtas." });
        //         }
        //         if (order.StatusId == 2)
        //         {
        //             return Conflict(new { code = "ORDER_CANCELLED", message = "Užsakymas buvo panaikintas." });
        //         }
        //         SellerDto seller = null;
        //         var fetchSellerQuery = @"
        //         SELECT * FROM Pardavejas
        //         left join Kontaktine_info on Valid = 1
        //         ";
        //         using (var fetchSellerCommand = new SqlCommand(fetchSellerQuery, connection))
        //         {
        //         using (var reader = await fetchSellerCommand.ExecuteReaderAsync())
        //         {
        //             while (await reader.ReadAsync())
        //             {
        //                 // Log retrieved columns
        //                 Console.WriteLine($"Pavadinimas: {reader["pavadinimas"] ?? "NULL"}");
        //                 Console.WriteLine($"Adresas: {reader["adresas"] ?? "NULL"}");

        //                 if (seller == null)
        //                 {
        //                     seller = new SellerDto
        //                     {
        //                         pavadinimas = reader["pavadinimas"]?.ToString(),
        //                         adresas = reader["adresas"].ToString(),
        //                         Tel_nr = reader["Telefonas"].ToString(),
        //                         el_pastas = reader["EMAIL"].ToString(),
        //                         asmens_kodas = reader["asmens_kodas"]?.ToString(),
        //                         A_saskaita = reader["A_saskaita"]?.ToString(),
        //                         Banko_pavadinimas = reader["Banko_pavadinimas"]?.ToString(),
        //                         Banko_kodas = reader["Banko_kodas"]?.ToString(),
        //                         i_v_Pazymejimas = reader["i_v_Pazymejimas"]?.ToString(),
        //                     };
        //                 }   
        //             }
        //         }
        //     }
        //         byte[] imgdata = GetImageFromDatabase(1);
        //         var pdfBytes = InvoiceGenerator.GenerateInvoice(order,seller ,imgdata );

        //         // Return PDF as file
        //         return File(pdfBytes, "application/pdf", $"{orderNumber}_ProForma.pdf");
        //     }
        //     catch (Exception ex)
        //     {
        //         exceptionLogger.LogException(
        //             source: "GetProFormaInvoice",
        //             message: ex.Message,
        //             stackTrace: ex.StackTrace
        //         );
        //         return StatusCode(500, new { message = "Nepavyko sugeneruoti sąskaitos." });
        //     }
        // }
        private async Task<OrderDTO> FetchOrder(SqlConnection connection, string orderNumber, string userId)
        {
            
            OrderDTO order = null;
            var fetchOrderQuery = @"
                SELECT 
                    u.UZS_NR, u.Date, u.DeliveryName, u.Status, u.TotalPrice, u.Name, u.Surname, 
                    u.City, u.Street, u.House_nr, u.Post_code, u.AK_IK, u.PVM_kodas,
                    ut.PRK_KODAS, ut.PRK_PAVADINIMAS, ut.Quantity, ut.Price, ut.Subtotal
                FROM 
                    UZSAKYMAI u
                LEFT JOIN 
                    UZSAKYMAI_TURINYS ut ON u.UZS_ID = ut.UZS_ID
                WHERE 
                    u.UZS_NR = @OrderNumber AND u.UserID = @UserId";

            using var fetchOrderCommand = new SqlCommand(fetchOrderQuery, connection);
            fetchOrderCommand.Parameters.AddWithValue("@OrderNumber", orderNumber);
            fetchOrderCommand.Parameters.AddWithValue("@UserId", userId);

            using var reader = await fetchOrderCommand.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                if (order == null)
                {
                    order = new OrderDTO
                    {
                        OrderNumber = orderNumber,
                        OrderDate = Convert.ToDateTime(reader["Date"]),
                        DeliveryName = reader["DeliveryName"].ToString(),
                        StatusId = Convert.ToInt32(reader["Status"]),
                        Status = GetStatusName(Convert.ToInt32(reader["Status"])),
                        Name = reader["Name"].ToString(),
                        Surname = reader["Surname"].ToString(),
                        City = reader["City"].ToString(),
                        Street = reader["Street"].ToString(),
                        HouseNumber = reader["House_nr"].ToString(),
                        PostCode = reader["Post_code"].ToString(),
                        ak_ik = reader["AK_IK"].ToString(),
                        Pvm_kodas = reader["PVM_kodas"].ToString(),
                        TotalPrice = Convert.ToDecimal(reader["TotalPrice"]),
                        Items = new List<OrderItemDTO>()
                    };
                }
                
                if (!reader.IsDBNull(reader.GetOrdinal("PRK_KODAS")))
                {
                    order.Items.Add(new OrderItemDTO
                    {
                        ProductCode = reader["PRK_KODAS"].ToString(),
                        ProductName = reader["PRK_PAVADINIMAS"].ToString(),
                        Quantity = Convert.ToInt32(reader["Quantity"]),
                        Price = Convert.ToDecimal(reader["Price"]),
                        Subtotal = Convert.ToDecimal(reader["Subtotal"])
                    });
                }
            }

            return order;
        }
        // dirbam su situ
        private async Task<InvoiceDTO> FetchInvoice(SqlConnection connection, string invoiceNumber, string userId)
            {
                try
                {
                    InvoiceDTO invoice = null;

                    var fetchInvoiceQuery = @"
                        SELECT 
                            s.SF_NR, s.SF_DATA, s.SF_SUMA, s.SF_GAVEJAS_FULL, s.SF_NAME, s.SF_SURNAME, 
                            s.SF_CITY, s.SF_STREET, s.SF_HOUSE_NR, s.SF_POSTCODE, s.SF_EMAIL, s.SF_PHONE, 
                            s.SF_AK_IK, s.SF_PVM_KODAS, 
                            st.PRK_KODAS, st.PRK_PAVADINIMAS, st.Quantity, st.Price, st.Subtotal
                        FROM 
                            SASKAITOS s
                        LEFT JOIN 
                            SASKAITOS_TURINYS st ON s.UZS_ID = st.UZS_ID
                        WHERE 
                            s.SF_NR = @InvoiceNumber AND s.SF_USER_ID = @UserId ";

                    using var fetchInvoiceCommand = new SqlCommand(fetchInvoiceQuery, connection);
                    fetchInvoiceCommand.Parameters.AddWithValue("@InvoiceNumber", invoiceNumber);
                    fetchInvoiceCommand.Parameters.AddWithValue("@UserId", userId);
                    using var reader = await fetchInvoiceCommand.ExecuteReaderAsync();

                    while (await reader.ReadAsync())
                    {
                        if (invoice == null)
                        {
                            invoice = new InvoiceDTO
                            {
                                InvoiceNumber = reader["SF_NR"].ToString(),
                                InvoiceDate = Convert.ToDateTime(reader["SF_DATA"]),
                                TotalPrice = reader.IsDBNull(reader.GetOrdinal("SF_SUMA")) ? 0 : Convert.ToDecimal(reader["SF_SUMA"]),
                                Name = reader["SF_NAME"].ToString(),
                                Surname = reader["SF_SURNAME"].ToString(),
                                City = reader["SF_CITY"].ToString(),
                                Street = reader["SF_STREET"].ToString(),
                                HouseNumber = reader["SF_HOUSE_NR"].ToString(),
                                PostCode = reader["SF_POSTCODE"].ToString(),
                                ak_ik = reader["SF_AK_IK"].ToString(),
                                Pvm_kodas = reader["SF_PVM_KODAS"].ToString(),
                                Items = new List<OrderItemDTO>()
                            };
                        }

                        if (!reader.IsDBNull(reader.GetOrdinal("PRK_KODAS")))
                        {
                            invoice.Items.Add(new OrderItemDTO
                            {
                                ProductCode = reader["PRK_KODAS"].ToString(),
                                ProductName = reader["PRK_PAVADINIMAS"].ToString(),
                                Quantity = Convert.ToInt32(reader["Quantity"]),
                                Price = Convert.ToDecimal(reader["Price"]),
                                Subtotal = Convert.ToDecimal(reader["Subtotal"])
                            });
                        }
                    }

                    Console.WriteLine("Invoice: " + invoice?.InvoiceNumber);
                    return invoice;
                }
                catch (SqlException sqlEx)
                {
                    // Handle SQL-specific exceptions (e.g., connection issues, invalid SQL)
                    Console.Error.WriteLine($"SQL Error fetching invoice: {sqlEx.Message}");
                    // Log the exception if you have a logger
                    exceptionLogger?.LogException("FetchInvoice - SQL Error", sqlEx.Message, sqlEx.StackTrace);
                    return null; // Return null or throw a custom exception if needed
                }
                catch (InvalidOperationException invalidOpEx)
                {
                    // Handle invalid operations (e.g., connection not open)
                    Console.Error.WriteLine($"Invalid operation: {invalidOpEx.Message}");
                    exceptionLogger?.LogException("FetchInvoice - Invalid Operation", invalidOpEx.Message, invalidOpEx.StackTrace);
                    return null;
                }
                catch (Exception ex)
                {
                    // Handle all other exceptions
                    Console.Error.WriteLine($"Unexpected error fetching invoice: {ex.Message}");
                    exceptionLogger?.LogException("FetchInvoice - Unexpected Error", ex.Message, ex.StackTrace);
                    return null;
                }
            }

        private (string EMAIL, string Phone, string Address) GetContactInfo()
                {
                    try
                    {
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                SELECT TELEFONAS, ADRESAS, EMAIL
                                FROM KONTAKTINE_INFO
                                WHERE info_ID = 1"; // Adjust the WHERE clause as needed

                            using (var command = new SqlCommand(query, connection))
                            {
                                using (var reader = command.ExecuteReader())
                                {
                                    if (reader.Read())
                                    {
                                        string phone = reader["TELEFONAS"].ToString();
                                        string address = reader["ADRESAS"].ToString();
                                        string EMAIL = reader["EMAIL"].ToString();
                                        return (EMAIL, phone, address);
                                    }
                                }
                            }
                        }
                        return (string.Empty, string.Empty, string.Empty);
                    }
                    catch (Exception e)
                    {
                        exceptionLogger.LogException(
                            source: "Resend Verification",
                            message: e.Message,
                            stackTrace: e.StackTrace
                        );
                        return (string.Empty, string.Empty, string.Empty);
                    }
                }
        private async Task SendThankYouEmail(string email, string orderId, byte[] pdfContent)
        {

                        var contactInfo = GetContactInfo();
                        string phone = contactInfo.Phone;
                        string address = contactInfo.Address;
                        string EMAIL = contactInfo.EMAIL; 
                        byte[] logoBytes = GetImageFromDatabase(1);
                        if (logoBytes == null || logoBytes.Length == 0)
                        {
                            Console.WriteLine("Could not retrieve logo from the database.");
                            return;
                        }
                        else
                        {
                            Console.WriteLine("Logo retrieved successfully.");
                        }
                        var emailBody = $@"
                            <html>
                                <body>
                                    <p>Ačiū už užsakymą! Jūsų užsakymo numeris yra: {orderId}</p>
                                    <p>Prašome peržiūrėti išankstinę sąskaitą priede.</p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p>Pagarbiai,</p>
                                    <p>Mindaugas</p>
                                    <br/>
                                    <hr/>
                                    <p><strong>Kontaktai:</strong></p>
                                    <p>el.paštas: {EMAIL}</p>
                                    <p>Telefono numeris: {phone}</p>
                                    <p>Adresas: {address}</p>
                                    <br/>
                                    <img src='cid:companyLogo' alt='Company Logo' style='width:150px;' />
                                </body>
                            </html>";

                






            var message = new MimeKit.MimeMessage();
            message.From.Add(new MimeKit.MailboxAddress("MindaugasAntique", "mindaugasantique@gmail.com"));
            message.To.Add(new MimeKit.MailboxAddress("", email));
            message.Subject = "Ačiū už užsakymą!";

            var builder = new MimeKit.BodyBuilder
            {
                 HtmlBody = emailBody
            };
            var logoAttachment = new MimeKit.MimePart("image", "png")
                        {
                            Content = new MimeKit.MimeContent(new System.IO.MemoryStream(logoBytes), MimeKit.ContentEncoding.Default),
                            ContentDisposition = new MimeKit.ContentDisposition(MimeKit.ContentDisposition.Inline),
                            ContentId = "companyLogo", 
                            FileName = "logo.png"
                        };

            // Add the attachment to the body
            builder.Attachments.Add(logoAttachment);
            // Attach the invoice PDF from byte[]
            builder.Attachments.Add($"Išankstinė_Sąskaita_{orderId}.pdf", pdfContent, new MimeKit.ContentType("application", "pdf"));
            message.Body = builder.ToMessageBody();

            using var client = new MailKit.Net.Smtp.SmtpClient();
            try
            {
                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("mindaugasantique@gmail.com",  _secretManager.GetGoogleSecretCode());
                await client.SendAsync(message);
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }
        private async Task SendInvoiceEmail(string email, string InvoiceNumber, byte[] pdfContent)
        {

                        var contactInfo = GetContactInfo();
                        string phone = contactInfo.Phone;
                        string address = contactInfo.Address;
                        string EMAIL = contactInfo.EMAIL; 
                        byte[] logoBytes = GetImageFromDatabase(1);
                        if (logoBytes == null || logoBytes.Length == 0)
                        {
                            Console.WriteLine("Could not retrieve logo from the database.");
                            return;
                        }
                        else
                        {
                            Console.WriteLine("Logo retrieved successfully.");
                        }
                        var emailBody = $@"
                            <html>
                                <body>
                                    <p>Gavome jūsų mokėjimą! Sąskaitos numeris: {InvoiceNumber}</p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p></p>
                                    <p>Pagarbiai,</p>
                                    <p>Mindaugas</p>
                                    <br/>
                                    <hr/>
                                    <p><strong>Kontaktai:</strong></p>
                                    <p>el.paštas: {EMAIL}</p>
                                    <p>Telefono numeris: {phone}</p>
                                    <p>Adresas: {address}</p>
                                    <br/>
                                    <img src='cid:companyLogo' alt='Company Logo' style='width:150px;' />
                                </body>
                            </html>";

                






            var message = new MimeKit.MimeMessage();
            message.From.Add(new MimeKit.MailboxAddress("MindaugasAntique", "mindaugasantique@gmail.com"));
            message.To.Add(new MimeKit.MailboxAddress("", email));
            message.Subject = "Ačiū kad perkate pas mus!";

            var builder = new MimeKit.BodyBuilder
            {
                 HtmlBody = emailBody
            };
            var logoAttachment = new MimeKit.MimePart("image", "png")
                        {
                            Content = new MimeKit.MimeContent(new System.IO.MemoryStream(logoBytes), MimeKit.ContentEncoding.Default),
                            ContentDisposition = new MimeKit.ContentDisposition(MimeKit.ContentDisposition.Inline),
                            ContentId = "companyLogo", 
                            FileName = "logo.png"
                        };

            // Add the attachment to the body
            builder.Attachments.Add(logoAttachment);
            // Attach the invoice PDF from byte[]
            builder.Attachments.Add($"Sąskaita_Faktūra_{InvoiceNumber}.pdf", pdfContent, new MimeKit.ContentType("application", "pdf"));
            message.Body = builder.ToMessageBody();

            using var client = new MailKit.Net.Smtp.SmtpClient();
            try
            {
                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("mindaugasantique@gmail.com",  _secretManager.GetGoogleSecretCode());
                await client.SendAsync(message);
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }

        private async Task<SellerDto> FetchSeller(SqlConnection connection)
    {
        SellerDto seller = null;
        var fetchSellerQuery = @"
            SELECT * FROM Pardavejas
            LEFT JOIN Kontaktine_info ON Valid = 1";

        using var fetchSellerCommand = new SqlCommand(fetchSellerQuery, connection);
        using var reader = await fetchSellerCommand.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (seller == null)
            {
                seller = new SellerDto
                {
                    pavadinimas = reader["pavadinimas"]?.ToString(),
                    adresas = reader["adresas"].ToString(),
                    Tel_nr = reader["Telefonas"].ToString(),
                    el_pastas = reader["EMAIL"].ToString(),
                    asmens_kodas = reader["asmens_kodas"]?.ToString(),
                    A_saskaita = reader["A_saskaita"]?.ToString(),
                    Banko_pavadinimas = reader["Banko_pavadinimas"]?.ToString(),
                    Banko_kodas = reader["Banko_kodas"]?.ToString(),
                    i_v_Pazymejimas = reader["i_v_Pazymejimas"]?.ToString(),
                };
            }
        }

        return seller;
    }
        [HttpGet("/GetProFormaInvoice/{orderNumber}")]
        [Authorize]
        public async Task<IActionResult> GetProFormaInvoice(string orderNumber)
    {
        try
        {
            var sessionId = User?.FindFirst("SessionId")?.Value;
            if (string.IsNullOrEmpty(sessionId))
            {
                return Unauthorized(new { message = "Sesijos ID nerastas arba baigė galioti." });
            }

            using var connection = _connectionProvider.GetConnection();
            await connection.OpenAsync();

            // Get UserId from SessionId
            string userId;
            var fetchUserIdQuery = "SELECT UserId FROM Sessions WHERE SessionId = @SessionId AND Active = 1";
            using (var fetchUserIdCommand = new SqlCommand(fetchUserIdQuery, connection))
            {
                fetchUserIdCommand.Parameters.AddWithValue("@SessionId", sessionId);
                using (var reader = await fetchUserIdCommand.ExecuteReaderAsync())
                {
                    if (!await reader.ReadAsync())
                    {
                        return Unauthorized(new { message = "Sesija negaliojanti arba nerasta." });
                    }

                    userId = reader["UserId"] as string;
                }
            }

            
            var pdfBytes = await GenerateProFormaInvoice(orderNumber, userId);

            // Return PDF as file
            return File(pdfBytes, "application/pdf", $"Išankstinė_Sąskaita_{orderNumber}.pdf");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            exceptionLogger.LogException("GetProFormaInvoice", ex.Message, ex.StackTrace);
            return StatusCode(500, new { message = "Nepavyko sugeneruoti sąskaitos." });
        }
    }
        [HttpGet("admin/GetProFormaInvoice/{orderNumber}")]
        public async Task<IActionResult> GetProFormaInvoice(
                [FromHeader(Name = "Admin-Secret-Code")] string adminSecretCode,
                string orderNumber,
                [FromQuery] string userId)
                {
                var expectedAdminSecret = _secretManager.GetAdminSecretCode();
                if (adminSecretCode != expectedAdminSecret)
                {
                    return Unauthorized(new { message = "Netinkamas admino kodas" });
                }

                try
                {
                    using var connection = _connectionProvider.GetConnection();
                    await connection.OpenAsync();

                    // Fetch the Pro Forma Invoice as PDF
                    var pdfBytes = await GenerateProFormaInvoice(orderNumber, userId);

                    // Return the PDF file
                    return File(pdfBytes, "application/pdf", $"Išankstinė_Sąskaita_{orderNumber}.pdf");
                }
                catch (KeyNotFoundException ex)
                {
                    return NotFound(new { message = ex.Message });
                }
                catch (InvalidOperationException ex)
                {
                    return Conflict(new { message = ex.Message });
                }
                catch (Exception ex)
                {
                    exceptionLogger .LogException("GetProFormaInvoice", ex.Message, ex.StackTrace);
                    return StatusCode(500, new { message = "Nepavyko sugeneruoti sąskaitos." });
                }
            }
        private byte[] GetImageFromDatabase(int assetId)
        {
            using var connection = _connectionProvider.GetConnection();
            connection.Open();
            
            var query = "SELECT IMG_DATA FROM logo WHERE logo_id = @logo_id";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@logo_id", assetId);
            return command.ExecuteScalar() as byte[];
        }

        private string GetStatusName(int status)
            {
                return status switch
                {
                    0 => "Naujas",
                    1 => "Apmokėtas",
                    2 => "Atšauktas",
                    _ => "Nežinomas"
                };
            }

        private int? GetStatusCode(string? status)
            {
                return status switch
                {
                    "Naujas" => 0,
                    "Apmokėtas" => 1,
                    "Atšauktas" => 2,
                    _ => null
                };
            }

        [HttpGet("admin/GetInvoice/{InvoiceNumber}")]
        public async Task<IActionResult> GetInvoice(
        [FromHeader(Name = "Admin-Secret-Code")] string adminSecretCode,
        string InvoiceNumber,
        [FromQuery] string userId)
            {
                // Validate the admin secret code
                var expectedAdminSecret = _secretManager.GetAdminSecretCode();
                if (adminSecretCode != expectedAdminSecret)
                {
                    return Unauthorized(new { message = "Netinkamas admino kodas" });
                }

                string email;
                try
                {
                    using var connection = _connectionProvider.GetConnection();
                    await connection.OpenAsync();  // Open the connection explicitly
                    using(var command = new SqlCommand("SELECT [EMAIL] FROM [USER] WHERE USERID = @USERID", connection))
                    {
                        command.Parameters.AddWithValue("@USERID", userId);
                        object result = await command.ExecuteScalarAsync(); // Use async version

                        if (result != null)
                        {
                            email = result.ToString();
                        }
                        else
                        {
                            return NotFound(new { message = "nerastas kliento el. pastas" });
                        }
                    }
                }
                catch (Exception ex)
                {
                    exceptionLogger.LogException("GetInvoice", ex.Message, ex.StackTrace);
                    return StatusCode(500, new { message = "Įvyko klaida gaunant vartotojo el. pašto informaciją" });
                }

                try
                {
                    using var connection = _connectionProvider.GetConnection();
                    await connection.OpenAsync();
                    var pdfBytes = await GenerateInvoice(InvoiceNumber, userId);
                    SendInvoiceEmail(email, InvoiceNumber, pdfBytes);
                    return File(pdfBytes, "application/pdf", $"Sąskaita_Faktūta_{InvoiceNumber}.pdf");
                }
                catch (KeyNotFoundException ex)
                {
                    return NotFound(new { message = ex.Message });
                }
                catch (InvalidOperationException ex)
                {
                    return Conflict(new { message = ex.Message });
                }
                catch (Exception ex)
                {
                    exceptionLogger.LogException("GetInvoice", ex.Message, ex.StackTrace);
                    return StatusCode(500, new { message = "Nepavyko sugeneruoti sąskaitos." });
                }
            }

        // 
        public class InvoiceGenerator
         {
        public static byte[] GenerateProformInvoice(OrderDTO order, SellerDto seller, byte[] logo)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(12).FontColor(Colors.Black));

                    // Header Section
                    page.Header().Row(header =>
                    {
                        if (logo != null && logo.Length > 0)
                        {
                            header.RelativeColumn(1).AlignLeft().Element(container =>
                            {
                                container
                                .Height(120) // Set container height
                                .Width(120)  // Set container width
                                .Image(logo, ImageScaling.FitHeight);
                            });
                        }
                        // header.RelativeColumn(2).AlignCenter().Text("UAB Jūsų Įmonė").FontSize(16).Bold();
                        header.RelativeColumn(1).AlignCenter().Text($"Išankstinė Sąskaita Nr: {order.OrderNumber}").FontSize(16);
                    });

                    // Content Section
                    page.Content().Column(column =>
                    {
                        column.Spacing(10);

                        // Seller and Buyer Sections
                        column.Item().Row(row =>
                        {
                            // Seller Section with Border
                            row.RelativeColumn(2).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(sellerColumn =>
                            {
                                sellerColumn.Item().Text("Pardavėjas:").FontSize(12).Bold();
                                sellerColumn.Item().Text(seller.pavadinimas).FontSize(8);
                                sellerColumn.Item().Text("Adresas: " + seller.adresas).FontSize(8);
                                sellerColumn.Item().Text("Telefono numeris: " + seller.Tel_nr).FontSize(8);
                                sellerColumn.Item().Text("El.paštas: " + seller.el_pastas).FontSize(8);
                                sellerColumn.Item().Text("Asmens Kodas: " + seller.asmens_kodas).FontSize(8);
                                sellerColumn.Item().Text("A./s.: " + seller.A_saskaita).FontSize(8);
                                sellerColumn.Item().Text(seller.Banko_pavadinimas).FontSize(8);
                                sellerColumn.Item().Text("Banko kodas: " + seller.Banko_kodas).FontSize(8);
                                sellerColumn.Item().Text("Individualios veiklos pažymėjimas: " + seller.i_v_Pazymejimas).FontSize(8);

                            });

                            // Buyer Section with Border
                            row.RelativeColumn(2).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(buyerColumn =>
                            {
                                buyerColumn.Item().Text("Pirkėjas:").FontSize(12).Bold();
                                buyerColumn.Item().Text($"{order.Name} {order.Surname}").FontSize(8);
                                buyerColumn.Item().Text($"Adresas: {order.Street} {order.HouseNumber} {order.City}").FontSize(8);
                                buyerColumn.Item().Text($"AK/ĮK: {order.ak_ik}").FontSize(8);
                                buyerColumn.Item().Text($"PVM kodas: {order.Pvm_kodas }").FontSize(8);
                            });
                        });
                        // prasideda lentele
                        decimal totalVatFromItems = 0;
                    // Items Table
                        column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Product Name
                                columns.RelativeColumn(1); // Quantity
                                columns.RelativeColumn(1); // Price
                                columns.RelativeColumn(1); // Subtotal (Without VAT)
                                columns.RelativeColumn(1); // VAT Amount
                            });

                            // Table Header
                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Prekės Pavadinimas").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("Kiekis").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("Kaina (€)").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("Viso (€)").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("PVM (21%) (€)").Bold().FontSize(8);
                            });

                            

                            // Table Rows
                            foreach (var item in order.Items)
                            {
                                var itemVat = Math.Round(item.Subtotal * 0.21M, 2); // Calculate VAT (21%)
                                totalVatFromItems += itemVat;

                                table.Cell().Element(CellStyle).Text(item.ProductName).WrapAnywhere().FontSize(8);
                                table.Cell().Element(CellStyle).Text(item.Quantity.ToString()).FontSize(8);
                                table.Cell().Element(CellStyle).Text($"{item.Price:0.00} €").FontSize(8);
                                table.Cell().Element(CellStyle).Text($"{item.Subtotal:0.00} €").FontSize(8);
                                table.Cell().Element(CellStyle).Text($"{itemVat:0.00} €").FontSize(8);
                            }
                        });

                        // Calculate VAT and base price based on total price
                        var basePrice = order.TotalPrice - totalVatFromItems;
                        

                        // Price Breakdown Section with Borders
                        column.Item().Row(row =>
                        {
                            row.RelativeColumn(); // Empty column to push the content to the right
                            row.RelativeColumn(1).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(3).Column(priceColumn =>
                            {
                                priceColumn.Spacing(3); // Reduce spacing between the rows
                                priceColumn.Item().AlignRight().Text($"Be PVM: {basePrice:0.00} €").Bold().FontSize(8);
                                priceColumn.Item().AlignRight().Text($"PVM (21%): {totalVatFromItems:0.00} €").FontSize(8).Italic();
                                priceColumn.Item().AlignRight().Text($"Iš viso: {order.TotalPrice:0.00} €").FontSize(12).Bold();
                                
                            });
                        });

                        // Total Amount in Words
                        column.Item().Row(row =>
                        {
                            row.AutoItem().Text("Suma žodžiais:").FontSize(10).Bold();
                            row.AutoItem().Text($" {ConvertAmountToWords(order.TotalPrice)}").FontSize(10).Italic();
                        });


                    // Signatures Section
                    column.Item().Row(signatureRow =>
                    {
                        // Left Section: Sąskaitą išrašė
                        signatureRow.RelativeColumn(3).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(leftColumn =>
                        {
                            leftColumn.Item().Text("Sąskaitą išrašė:").FontSize(10).Bold();
                            leftColumn.Item().LineHorizontal(1); // Signature line
                            leftColumn.Item().Text("vardas pavardė, pareigos, parašas").FontSize(8).Italic().AlignRight();
                        });

                        // Right Section: Sąskaitą priėmė
                        signatureRow.RelativeColumn(3).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(rightColumn =>
                        {
                            rightColumn.Item().Text("Sąskaitą priėmė:").FontSize(10).Bold();
                            rightColumn.Item().LineHorizontal(1); // Signature line
                        });
                    });


                    });

                    // Footer Section
                    page.Footer().AlignCenter().Text("Ačiū, kad pirkote pas mus!").FontSize(10).Italic();
                });
            }).GeneratePdf();
        }

        public static byte[] GenerateInvoice(InvoiceDTO invoice, SellerDto seller, byte[] logo){

            {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(12).FontColor(Colors.Black));

                    // Header Section
                    page.Header().Row(header =>
                    {
                        if (logo != null && logo.Length > 0)
                        {
                            header.RelativeColumn(1).AlignLeft().Element(container =>
                            {
                                container
                                .Height(120) 
                                .Width(120)  
                                .Image(logo, ImageScaling.FitHeight);
                            });
                        }
                        // header.RelativeColumn(2).AlignCenter().Text("UAB Jūsų Įmonė").FontSize(16).Bold();
                        header.RelativeColumn(1).AlignCenter().Text($"Sąskaita Faktūra Nr: {invoice.InvoiceNumber}").FontSize(16);
                        
                    });

                    // Content Section
                    page.Content().Column(column =>
                    {
                        column.Spacing(10);

                        // Seller and Buyer Sections
                        column.Item().Row(row =>
                        {
                            // Seller Section with Border
                            row.RelativeColumn(2).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(sellerColumn =>
                            {
                                sellerColumn.Item().Text("Pardavėjas:").FontSize(12).Bold();
                                sellerColumn.Item().Text(seller.pavadinimas).FontSize(8);
                                sellerColumn.Item().Text("Adresas: " + seller.adresas).FontSize(8);
                                sellerColumn.Item().Text("Telefono numeris: " + seller.Tel_nr).FontSize(8);
                                sellerColumn.Item().Text("El.paštas: " + seller.el_pastas).FontSize(8);
                                sellerColumn.Item().Text("Asmens Kodas: " + seller.asmens_kodas).FontSize(8);
                                sellerColumn.Item().Text("A./s.: " + seller.A_saskaita).FontSize(8);
                                sellerColumn.Item().Text(seller.Banko_pavadinimas).FontSize(8);
                                sellerColumn.Item().Text("Banko kodas: " + seller.Banko_kodas).FontSize(8);
                                sellerColumn.Item().Text("Individualios veiklos pažymėjimas: " + seller.i_v_Pazymejimas).FontSize(8);

                            });

                            // Buyer Section with Border
                            row.RelativeColumn(2).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(buyerColumn =>
                            {
                                buyerColumn.Item().Text("Pirkėjas:").FontSize(12).Bold();
                                buyerColumn.Item().Text($"{invoice.Name} {invoice.Surname}").FontSize(8);
                                buyerColumn.Item().Text($"Adresas: {invoice.Street} {invoice.HouseNumber} {invoice.City}").FontSize(8);
                                buyerColumn.Item().Text($"AK/ĮK: {invoice.ak_ik}").FontSize(8);
                                buyerColumn.Item().Text($"PVM kodas: {invoice.Pvm_kodas }").FontSize(8);
                            });
                        });
                        // prasideda lentele
                        decimal totalVatFromItems = 0;
                    // Items Table
                        column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Product Name
                                columns.RelativeColumn(1); // Quantity
                                columns.RelativeColumn(1); // Price
                                columns.RelativeColumn(1); // Subtotal (Without VAT)
                                columns.RelativeColumn(1); // VAT Amount
                            });

                            // Table Header
                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Prekės Pavadinimas").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("Kiekis").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("Kaina (€)").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("Viso (€)").Bold().FontSize(8);
                                header.Cell().Element(CellStyle).Text("PVM (21%) (€)").Bold().FontSize(8);
                            });

                            

                            // Table Rows
                            foreach (var item in invoice.Items)
                            {
                                var itemVat = Math.Round(item.Subtotal * 0.21M, 2); // Calculate VAT (21%)
                                totalVatFromItems += itemVat;

                                table.Cell().Element(CellStyle).Text(item.ProductName).WrapAnywhere().FontSize(8);
                                table.Cell().Element(CellStyle).Text(item.Quantity.ToString()).FontSize(8);
                                table.Cell().Element(CellStyle).Text($"{item.Price:0.00} €").FontSize(8);
                                table.Cell().Element(CellStyle).Text($"{item.Subtotal:0.00} €").FontSize(8);
                                table.Cell().Element(CellStyle).Text($"{itemVat:0.00} €").FontSize(8);
                            }
                        });

                        // Calculate VAT and base price based on total price
                        var basePrice = invoice.TotalPrice - totalVatFromItems;
                        

                        // Price Breakdown Section with Borders
                        column.Item().Row(row =>
                        {
                            row.RelativeColumn(); // Empty column to push the content to the right
                            row.RelativeColumn(1).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(3).Column(priceColumn =>
                            {
                                priceColumn.Spacing(3); // Reduce spacing between the rows
                                priceColumn.Item().AlignRight().Text($"Be PVM: {basePrice:0.00} €").Bold().FontSize(8);
                                priceColumn.Item().AlignRight().Text($"PVM (21%): {totalVatFromItems:0.00} €").FontSize(8).Italic();
                                priceColumn.Item().AlignRight().Text($"Iš viso: {invoice.TotalPrice:0.00} €").FontSize(12).Bold();
                                
                            });
                        });

                        // Total Amount in Words
                        column.Item().Row(row =>
                        {
                            row.AutoItem().Text("Suma žodžiais:").FontSize(10).Bold();
                            row.AutoItem().Text($" {ConvertAmountToWords(invoice.TotalPrice)}").FontSize(10).Italic();
                        });


                    // Signatures Section
                    column.Item().Row(signatureRow =>
                    {
                        // Left Section: Sąskaitą išrašė
                        signatureRow.RelativeColumn(3).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(leftColumn =>
                        {
                            leftColumn.Item().Text("Sąskaitą išrašė:").FontSize(10).Bold();
                            leftColumn.Item().LineHorizontal(1); // Signature line
                            leftColumn.Item().Text("vardas pavardė, pareigos, parašas").FontSize(8).Italic().AlignRight();
                        });

                        // Right Section: Sąskaitą priėmė
                        signatureRow.RelativeColumn(3).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(rightColumn =>
                        {
                            rightColumn.Item().Text("Sąskaitą priėmė:").FontSize(10).Bold();
                            rightColumn.Item().LineHorizontal(1); // Signature line
                        });
                    });


                    });

                    // Footer Section
                    page.Footer().AlignCenter().Text("Ačiū, kad pirkote pas mus!").FontSize(10).Italic();
                });
            }).GeneratePdf();
        }


        }
        private static IContainer CellStyle(IContainer container)
        {
            return container.Padding(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
        }

        public static string ConvertAmountToWords(decimal amount)
                {
                    // Split amount into euros and cents
                    int euros = (int)amount; // Whole number part
                    int cents = (int)((amount - euros) * 100); // Fractional part

                    // Convert euros and cents to words
                    string eurosInWords = ConvertNumberToWords(euros) + GetEuroWord(euros);
                    string centsInWords = ConvertNumberToWords(cents) + GetCentWord(cents);

                    // Combine the result
                    return $"{eurosInWords} ir {centsInWords}";
                }

        private static string ConvertNumberToWords(int number)
                {
                    if (number == 0) return "nulis";

                    string[] units = { "", "vienas", "du", "trys", "keturi", "penki", "šeši", "septyni", "aštuoni", "devyni" };
                    string[] teens = { "dešimt", "vienuolika", "dvylika", "trylika", "keturiolika", "penkiolika", "šešiolika", "septyniolika", "aštuoniolika", "devyniolika" };
                    string[] tens = { "", "", "dvidešimt", "trisdešimt", "keturiasdešimt", "penkiasdešimt", "šešiasdešimt", "septyniasdešimt", "aštuoniasdešimt", "devyniasdešimt" };
                    string[] hundreds = { "", "šimtas", "du šimtai", "trys šimtai", "keturi šimtai", "penki šimtai", "šeši šimtai", "septyni šimtai", "aštuoni šimtai", "devyni šimtai" };

                    string words = "";

                    if (number / 100 > 0)
                    {
                        words += hundreds[number / 100] + " ";
                        number %= 100;
                    }

                    if (number >= 10 && number <= 19)
                    {
                        words += teens[number - 10] + " ";
                    }
                    else
                    {
                        if (number / 10 > 0)
                        {
                            words += tens[number / 10] + " ";
                        }
                        if (number % 10 > 0)
                        {
                            words += units[number % 10] + " ";
                        }
                    }

                    return words.Trim();
                }

        private static string GetEuroWord(int euros)
            {
                if (euros == 1) return " euras";
                else if (euros % 10 >= 2 && euros % 10 <= 9 && (euros % 100 < 10 || euros % 100 >= 20)) return " eurai";
                else return " eurų";
            }

        private static string GetCentWord(int cents)
            {
                if (cents == 1) return " centas";
                else if (cents % 10 >= 2 && cents % 10 <= 9 && (cents % 100 < 10 || cents % 100 >= 20)) return " centai";
                else return " centų";
            }

    }
       


public class Order
{
    public string Name { get; set; }
    public string Surname { get; set; }
    public string Phone { get; set; }
    public string City { get; set; }
    public string Street { get; set; }
    public string HouseNumber { get; set; }
    public string PostCode { get; set; }
    public string DeliveryName { get; set; }
    
    public int DeliveryFee { get; set; }
    public string DeliveryType { get; set; }
    public int PaymentMethodID { get; set; } 
    public float TotalPrice { get; set; } 
    public List<OrderItem> Items { get; set; }
}
public class OrderItem
{
    public string ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
public class SellerDto
{
    public string pavadinimas { get; set; } 
    public string adresas { get; set; } 
    public string Tel_nr { get; set; } 
    public string el_pastas { get; set; } 
    public string asmens_kodas{ get; set; } 
    public string A_saskaita { get; set; } 
    public string Banko_pavadinimas { get; set; } 
    public string Banko_kodas { get; set; } 
    public string i_v_Pazymejimas{ get; set; } 
}
public class OrderDTO
{   
    public string OrderNumber { get; set; } // UZS_NR
    public string Name {get;set;}
    public string Surname {get;set;}
    public string City {get;set;}
    public string Street {get;set;}
    public string HouseNumber { get; set; }
    public string PostCode { get; set; } 
    public DateTime OrderDate { get; set; } // Date
    public string DeliveryName { get; set; } // DeliveryName
    public string Status { get; set; } 
    public string ak_ik { get; set; } 
    public string Pvm_kodas { get; set; } 
    public int StatusId { get; set; } 
    public decimal TotalPrice { get; set; } // TotalPrice
    public List<OrderItemDTO> Items { get; set; } // List of items
}
public class OrderItemDTO
{
    public string ProductCode { get; set; } // PRK_KODAS
    public string ProductName { get; set; } // PRK_PAVADINIMAS
    public int Quantity { get; set; } // Quantity
    public decimal Price { get; set; } // Price
    public decimal Subtotal { get; set; } // Subtotal
}
public class InvoiceDTO
{   
    public string InvoiceNumber { get; set; } // UZS_NR
    public string Name {get;set;}
    public string Surname {get;set;}
    public string City {get;set;}
    public string Street {get;set;}
    public string HouseNumber { get; set; }
    public string PostCode { get; set; } 
    public DateTime InvoiceDate { get; set; } // Date
    public string ak_ik { get; set; } 
    public string Pvm_kodas { get; set; } 
    public int StatusId { get; set; } 
    public decimal TotalPrice { get; set; } // TotalPrice
    public List<OrderItemDTO> Items { get; set; } // List of items
}
public class InvoiceItemDTO
{
    public string ProductCode { get; set; } // PRK_KODAS
    public string ProductName { get; set; } // PRK_PAVADINIMAS
    public int Quantity { get; set; } // Quantity
    public decimal Price { get; set; } // Price
    public decimal Subtotal { get; set; } // Subtotal
}

}
}