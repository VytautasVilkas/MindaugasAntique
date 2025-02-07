
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Linq.Expressions;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using MailKit.Security;
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
using Google.Apis.Auth;
using Microsoft.Identity.Client;
using System.Reflection.Metadata.Ecma335;
namespace ShopApi.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ConnectionProvider _connectionProvider;
    private readonly DataTableService _dataTableService;
    private ExceptionLogger exceptionLogger;
    private readonly SecretManager _secretManager;

    public UserController(ConnectionProvider connectionProvider, SecretManager secretManager, DataTableService dataTableService)
    {
        _connectionProvider = connectionProvider;
        _dataTableService = dataTableService;
        exceptionLogger = new ExceptionLogger(_connectionProvider);
        _secretManager = secretManager;
    }
                public string GenerateResetToken(string userId, string resetToken, DateTime expiresAt)
                    {
                        var jwtSecretKey = _secretManager.GetJwtSecretCode();
                        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
                        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

                        var claims = new[]
                        {
                            new Claim(JwtRegisteredClaimNames.Sub, userId),
                            new Claim("resetToken", resetToken),
                            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                            new Claim(JwtRegisteredClaimNames.Exp, 
                                    new DateTimeOffset(expiresAt).ToUnixTimeSeconds().ToString(), 
                                    ClaimValueTypes.Integer64)
                        };

                        var token = new JwtSecurityToken(
                            issuer: "https://mindaugasantique.cloud",
                            audience: "https://MindaugasAntique.lt",
                            claims: claims,
                            expires: expiresAt,
                            signingCredentials: credentials
                        );

                        return new JwtSecurityTokenHandler().WriteToken(token);
                    }

                [HttpPost("forgot-password")]
                public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
                {
                    var user = GetUserIdByEmail(request.Email);

                    if (user != null)
                    {
                        // Generate unique reset token
                        var resetSession = Guid.NewGuid().ToString();
                        var expiresAt = DateTime.UtcNow.AddDays(1);

                        // Store token in database
                        if (!PasswordResetToken(user,
                            resetSession,
                            expiresAt,
                            true)){
                                Console.WriteLine("klaida: nepavyko sukurti sesijos");
                                return BadRequest(new { Message = "Klaida" });
                            }
                        
                        var jwtToken =  GenerateResetToken(user, resetSession, expiresAt);
                        var resetLink = $"https://localhost:5173/slaptazodzio-pakeitimas?token={Uri.EscapeDataString(jwtToken)}";

                        await SendPasswordResetEmailAsync(request.Email, resetLink);
                    }else {
                         return NotFound(new { message = "Naudotojas su šiuo el. paštu nerastas!" });
                    }

                    return Ok(new { Message = "Sekmingai išsiųsta" });
                }
                private Boolean PasswordResetToken(String user,String resetSession,DateTime expiresAt,Boolean IsActive)
                {
                        try{
                        

                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                INSERT INTO PasswordResetSession (ResetSessionId, UserId, ExpirationDate,IsActive) 
                                VALUES (@ResetSessionId, @UserId, @ExpirationDate,@IsActive)
                            ";

                            var command = new SqlCommand(query, connection);
                            command.Parameters.AddWithValue("@ResetSessionId", resetSession);
                            command.Parameters.AddWithValue("@UserId", user);
                            command.Parameters.AddWithValue("@IsActive", IsActive);
                            command.Parameters.AddWithValue("@ExpirationDate", DateTime.UtcNow.AddDays(1));
                            command.ExecuteNonQuery();
                            return true;
                        }

                       
                        }catch(Exception ex){
                            exceptionLogger.LogException(
                            source: "CreateGuestSessionId",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                            );
                            return false ;
                        }
                        
                }
                public async Task SendPasswordResetEmailAsync(string email, string verificationLink)
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

                        // Generate the HTML email body
                        var emailBody = $@"
                            <html>
                                <body>
                                    <p>Mielas kliente,</p>
                                    <p></p>
                                    <p></p>
                                    <p>Slaptažodi galite pasikeisti paspaudus ant nuorodos:</p>
                                    <a href='{verificationLink}'>Nuorodą pasikeisti slaptažodį </a><br>
                                    <p>Nuoroda galioja 24 valandas</p>
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

                        // Create and configure the email message
                        var message = new MimeKit.MimeMessage();
                        message.From.Add(new MimeKit.MailboxAddress("MindaugasAntiqueTest", "vytautasvilkas16@gmail.com"));
                        message.To.Add(new MimeKit.MailboxAddress("", email));
                        message.Subject = "El.pašto patvirtinimas";

                        // Create the HTML body part
                        var bodyBuilder = new MimeKit.BodyBuilder();
                        bodyBuilder.HtmlBody = emailBody;

                        // Attach the logo as an inline attachment
                        var logoAttachment = new MimeKit.MimePart("image", "png")
                        {
                            Content = new MimeKit.MimeContent(new System.IO.MemoryStream(logoBytes), MimeKit.ContentEncoding.Default),
                            ContentDisposition = new MimeKit.ContentDisposition(MimeKit.ContentDisposition.Inline),
                            ContentId = "companyLogo", 
                            FileName = "logo.png"
                        };

                        // Add the attachment to the body
                        bodyBuilder.Attachments.Add(logoAttachment);

                        // Set the message body
                        message.Body = bodyBuilder.ToMessageBody();

                        using (var client = new MailKit.Net.Smtp.SmtpClient())
                        {
                            try
                            {
                                // Connect to Gmail's SMTP server
                                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);

                                // Authenticate with Gmail
                                await client.AuthenticateAsync("vytautasvilkas16@gmail.com", _secretManager.GetGoogleSecretCode());

                                // Send the email
                                await client.SendAsync(message);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error sending email: {ex.Message}");
                                throw;
                            }
                            finally
                            {
                                await client.DisconnectAsync(true);
                            }
                        }
                    }

                [HttpGet("GuestSession")]
                [AllowAnonymous]
                public IActionResult GenerateGuestSession()
                {
                    // Check if GUEST_SESSION_ID already exists
                    var existingGuestSessionId = Request.Cookies["GUEST_SESSION_ID"];
                    if (!string.IsNullOrEmpty(existingGuestSessionId))
                    {
                        return Ok(new { sessionId = existingGuestSessionId, message = "Guest session already exists." });
                    }
                    var newSessionId = CreateGuestSessionId("Guest");

                    Response.Cookies.Append("GUEST_SESSION_ID", newSessionId, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTime.UtcNow.AddDays(60) 
                    });

                    return Ok(new { sessionId = newSessionId, message = "Nauja sesija sukurta" });
                }
                [HttpGet("SessionInfo")]
                [AllowAnonymous]
                public IActionResult SessionInfo()
                {
                    var existingSessionId = Request.Cookies["SESSION_ID"];
                    if (!string.IsNullOrEmpty(existingSessionId))
                    {
                        Response.Cookies.Delete("SESSION_ID");
                        return Ok(new { message = "Sesija baigta" });
                    }
                    return  BadRequest(new { message = "Sesija nerasta" });
                }
                private string CreateGuestSessionId(string userId)
                    {
                        try{
                        var sessionId = Guid.NewGuid().ToString();

                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                INSERT INTO GUEST_SESSIONS (SessionId, UserId, CreatedAt) 
                                VALUES (@SessionId, @UserId, @CreatedAt)
                            ";

                            var command = new SqlCommand(query, connection);
                            command.Parameters.AddWithValue("@SessionId", sessionId);
                            command.Parameters.AddWithValue("@UserId", userId);
                            command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                            command.ExecuteNonQuery();
                        }

                        return sessionId;
                        }catch(Exception ex){
                            exceptionLogger.LogException(
                            source: "CreateGuestSessionId",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                            );
                            return "";
                        }
                    }
                private string CreateSessionId(string userId)
                    {
                        try{
                        var sessionId = Guid.NewGuid().ToString();

                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                INSERT INTO Sessions (SessionId, UserId, CreatedAt,Active) 
                                VALUES (@SessionId, @UserId, @CreatedAt,@Active)
                            ";

                            var command = new SqlCommand(query, connection);
                            command.Parameters.AddWithValue("@SessionId", sessionId);
                            command.Parameters.AddWithValue("@UserId", userId);
                            command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                            command.Parameters.AddWithValue("@Active", 1);

                            command.ExecuteNonQuery();
                        }

                        return sessionId;
                        }catch(Exception ex){
                            exceptionLogger.LogException(
                            source: "CreateSessionId",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                            );
                            return "";
                        }
                    }
                [HttpPost("logout")]
                [AllowAnonymous]
                public IActionResult Logout()
                {
                    var exceptionLogger = new ExceptionLogger(_connectionProvider);

                    try
                    {
                        // Get refresh token from HTTP-only cookie
                        var refreshToken = Request.Cookies["REFRESH_TOKEN"];
                        if (string.IsNullOrEmpty(refreshToken))
                        {
                            return BadRequest(new { message = "Truksta atnaujinimo tokeno" });
                        }

                        string sessionId = GetSessionIdFromRefreshTokenWithNoExpiration(refreshToken);
                        if (string.IsNullOrEmpty(sessionId))
                        {
                            return BadRequest(new { message = "Netinkamas arba nebegaliojantis tokenas" });
                        }
                        MarkSessionInactive(sessionId);
                        DeleteRefreshToken(refreshToken);
                        Response.Cookies.Delete("ACCESS_TOKEN");
                        Response.Cookies.Delete("REFRESH_TOKEN");
                        Response.Cookies.Delete("SESSION_ID");
                        return Ok(new { message = "Atsijungta sekmingai" });
                    }
                    catch (Exception ex)
                    {
                        exceptionLogger.LogException(
                            source: "Logout",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                        );
                        return StatusCode(500, new { message = "Klaida Bandant atsijungti" });
                    }
                }
                [HttpPost("loginWithGoogle")]
                [AllowAnonymous]
                public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginRequest request)
                {
                    // Validate Google ID token
                    if (string.IsNullOrEmpty(request.IdToken))
                    {
                        return BadRequest(new { message = "Google tokenas neteisingas" });
                    }

                    try
                    {
                        var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
                        var email = payload.Email;
                        var name = payload.Name;

                        AppUser user;
                        if (!UserExists(email)) {
                            user = await CreateGoogleUser(name, email);
                        }else{
                            user = AuthenticateGoogleUser(email);
                        }
                        if (user == null){
                            return Unauthorized(new { message = "el.pašto adresas buvo panaudotas registruojant vartotoją" });
                        }
                        return GenerateSessionAndTokens(user);

                    }
                    catch (Exception ex)
                    {
                        exceptionLogger.LogException(
                            source: "loginWithGoogle",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                        );
                        return BadRequest(new { message = "Neteisingas Google ID Token.", details = ex.Message });
                    }
                }
                [HttpPost("login")]
                [AllowAnonymous]
                public IActionResult Login([FromBody] LoginRequest request)
                    {
                        try
                        {
                            var user = AuthenticateUser(request.Email, request.Password);
                            if (user == null)
                            {
                                return Unauthorized(new { message = "Neteisingas el.paštas arba slaptažodis" });
                            }
                            if (user.Activated == 0)
                            {
                                return Unauthorized(new { message = "Patvirtinkite el.paštą" });
                            }

                            return GenerateSessionAndTokens(user);
                        }
                        catch (Exception ex)
                        {
                            exceptionLogger.LogException(
                                source: "login",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
                            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Klaida jungiantis" });
                        }
                    }
                private IActionResult GenerateSessionAndTokens(AppUser user)
                    {
                        try
                        {
                            
                            CleanupUserSessionsAndTokens(user.Id);

                            // Generate new tokens
                            var sessionId = CreateSessionId(user.Id);
                            var accessToken = GenerateJwtToken(sessionId);
                            var refreshToken = GenerateRefreshToken();

                            // Save the refresh token
                            SaveRefreshToken(sessionId, refreshToken);

                            // Set cookies for tokens
                            Response.Cookies.Append("ACCESS_TOKEN", accessToken, new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTime.UtcNow.AddMinutes(15)
                            });

                            Response.Cookies.Append("REFRESH_TOKEN", refreshToken, new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTime.UtcNow.AddDays(7)
                            });

                            Response.Cookies.Append("SESSION_ID", sessionId, new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTime.UtcNow.AddDays(60)
                            });

                            // Return success response
                            return Ok(new { message = "Sekmingai prisijungta" });
                        }
                        catch (Exception ex)
                        {
                            exceptionLogger.LogException(
                                source: "GenerateSessionAndTokens",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
                            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Klaida Bandant prisijungti" });
                        }
                    }
                // [HttpPost("login")]
                // [AllowAnonymous]
                // public IActionResult Login([FromBody] LoginRequest request)
                // {
                //     try
                //     {
                //         var user = AuthenticateUser(request.Email, request.Password);
                //         if (user == null)
                //         {
                //             Console.WriteLine("Invalid credentials provided.");
                //             return Unauthorized(new { message = "Neteisingas el.paštas arba slaptažodis" });
                //         }
                //         if (user.Activated == 0)
                //         {
                //             Console.WriteLine("User email not activated.");
                //             return Unauthorized(new { message = "Patvirtinkite el.paštą" });
                //         }

                //         // Clean up previous sessions and tokens
                //         CleanupUserSessionsAndTokens(user.Id);

                //         // Generate new tokens
                //         var sessionId = CreateSessionId(user.Id);
                //         var accessToken = GenerateJwtToken(sessionId);
                //         var refreshToken = GenerateRefreshToken();

                //         // Save the refresh token
                //         SaveRefreshToken(sessionId, refreshToken);

                //         // Set cookies for tokens
                //         Response.Cookies.Append("ACCESS_TOKEN", accessToken, new CookieOptions
                //         {
                //             HttpOnly = true,
                //             Secure = true,
                //             SameSite = SameSiteMode.Strict,
                //             Expires = DateTime.UtcNow.AddMinutes(15)
                //         });

                //         Response.Cookies.Append("REFRESH_TOKEN", refreshToken, new CookieOptions
                //         {
                //             HttpOnly = true,
                //             Secure = true,
                //             SameSite = SameSiteMode.Strict,
                //             Expires = DateTime.UtcNow.AddDays(7)
                //         });
                //         Response.Cookies.Append("SESSION_ID", sessionId, new CookieOptions
                //         {
                //             HttpOnly = true, 
                //             Secure = true, 
                //             SameSite = SameSiteMode.Strict,
                //             Expires = DateTime.UtcNow.AddDays(60)
                //         });

                //         // Return session ID to client
                //         return Ok(new { message = "Sveiki prisijungę"});
                //     }
                //     catch (Exception ex)
                //     {
                        
                //         exceptionLogger.LogException(
                //                     source: "login",
                //                     message: ex.Message,
                //                     stackTrace: ex.StackTrace
                //         );
                //         return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Klaida jungiantis" });
                //     }
                // }
                private void CleanupUserSessionsAndTokens(string userId)
                    {
                        try
                        {
                            using (var connection = _connectionProvider.GetConnection())
                            {
                                connection.Open();
                                using (var transaction = connection.BeginTransaction())
                                {
                                    try
                                    {
                                        // Step 1: Fetch session IDs for the user
                                        var sessionIds = new List<string>();
                                        var getSessionsIdQuery = "SELECT SessionId FROM Sessions WHERE UserId = @UserId";
                                        using (var getSessionsIdCommand = new SqlCommand(getSessionsIdQuery, connection, transaction))
                                        {
                                            getSessionsIdCommand.Parameters.AddWithValue("@UserId", userId);
                                            using (var reader = getSessionsIdCommand.ExecuteReader())
                                            {
                                                while (reader.Read())
                                                {
                                                    sessionIds.Add(reader["SessionId"].ToString());
                                                }
                                            }
                                        }

                
                                        foreach (var sessionId in sessionIds)
                                        {
                                            // Mark session as inactive
                                            var updateSessionQuery = "UPDATE Sessions SET ACTIVE = 0 WHERE SessionId = @SessionId";
                                            using (var updateSessionCommand = new SqlCommand(updateSessionQuery, connection, transaction))
                                            {
                                                updateSessionCommand.Parameters.AddWithValue("@SessionId", sessionId);
                                                updateSessionCommand.ExecuteNonQuery();
                                            }
                                            var deleteTokensQuery = "DELETE FROM RefreshTokens WHERE SessionId = @SessionId";
                                            using (var deleteTokensCommand = new SqlCommand(deleteTokensQuery, connection, transaction))
                                            {
                                                deleteTokensCommand.Parameters.AddWithValue("@SessionId", sessionId);
                                                deleteTokensCommand.ExecuteNonQuery();
                                            }
                                        }

                                        // Commit the transaction
                                        transaction.Commit();
                                    }
                                    catch (Exception ex)
                                    {
                                        transaction.Rollback();

                                        exceptionLogger.LogException(
                                            source: "CleanupUserSessionsAndTokens",
                                            message: ex.Message,
                                            stackTrace: ex.StackTrace
                                        );
                                        throw;
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log the exception if necessary
                            Console.WriteLine("Error in CleanupUserSessionsAndTokens: " + ex.Message);
                            exceptionLogger.LogException(
                                    source: "CleanupUserSessionsAndTokens",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                        );
                            throw;
                        }
                    }
                [HttpPost("refreshToken")]
                [AllowAnonymous]
                public IActionResult RefreshToken()
                {
                    try
                    {
                        var refreshToken = Request.Cookies["REFRESH_TOKEN"];
                        if (string.IsNullOrEmpty(refreshToken))
                        {
                            return Unauthorized(new { message = "Atnaujinimo tokenas nebegalioja" });
                        }
                        var sessionId = GetSessionIdFromRefreshToken(refreshToken);
                        if (sessionId == null)
                        {
                            return Unauthorized(new { message = "Sesija nebegalioja" });
                        }
                        var newAccessToken = GenerateJwtToken(sessionId);
                        var newRefreshToken = GenerateRefreshToken();
                        SaveRefreshToken(sessionId, newRefreshToken);
                        Response.Cookies.Append("ACCESS_TOKEN", newAccessToken, new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Expires = DateTime.UtcNow.AddMinutes(15)
                        });

                        Response.Cookies.Append("REFRESH_TOKEN", newRefreshToken, new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Expires = DateTime.UtcNow.AddDays(7)
                        });
                        Response.Cookies.Append("SESSION_ID", sessionId, new CookieOptions
                        {
                                    HttpOnly = true, 
                                    Secure = true, 
                                    SameSite = SameSiteMode.Strict,
                                    Expires = DateTime.UtcNow.AddDays(60)
                        });

                        return Ok(new { message = "Token refreshed successfully." });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error refreshing token: {ex.Message}");
                        exceptionLogger.LogException(
                                    source: "refreshToken",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                        );
                        return StatusCode(500, new { message = "Klaida atnaujinant tokena" });
                    }
                }
                private string GetSessionIdFromRefreshToken(string refreshToken)
                {
                    try
                    {
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var command = new SqlCommand(
                                @"
                                SELECT rt.SessionId
                                FROM RefreshTokens rt
                                WHERE rt.Token = @Token AND rt.ExpiryDate > @Now
                                ",
                                connection
                            );
                            command.Parameters.AddWithValue("@Token", refreshToken);
                            command.Parameters.AddWithValue("@Now", DateTime.UtcNow);

                            using (var reader = command.ExecuteReader())
                            {
                                if (reader.Read())
                                {
                                    
                                    return reader["SessionId"].ToString();
                                }
                                else
                                {
                                    // If no valid session is found, return null (or throw an exception as needed)
                                    return null;
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error retrieving session ID: {ex.Message}");
                        throw; // Rethrow the exception or handle it appropriately
                    }
                }
                private void DeleteRefreshToken(string refreshToken)
                    {
                        try{
                        
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var command = new SqlCommand(
                                "DELETE FROM RefreshTokens WHERE Token = @Token",
                                connection
                            );
                            command.Parameters.AddWithValue("@Token", refreshToken);
                            command.ExecuteNonQuery();
                            
                        }
                        }catch(Exception ex){
                           throw;
                        }
                    }
                private string GetSessionIdFromRefreshTokenWithNoExpiration(string refreshToken)
                        {
                            try
                            {
                                using (var connection = _connectionProvider.GetConnection())
                                {
                                    connection.Open();
                                    var query = "SELECT SessionId FROM RefreshTokens WHERE Token = @Token";
                                    using (var command = new SqlCommand(query, connection))
                                    {
                                        command.Parameters.AddWithValue("@Token", refreshToken);
                                        return command.ExecuteScalar()?.ToString();
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine("Error fetching sessionId from refresh token: " + ex.Message);
                                throw;
                            }
                        }
                private void MarkSessionInactive(string sessionId)
                    {
                        try
                        {
                            using (var connection = _connectionProvider.GetConnection())
                            {
                                connection.Open();
                                var query = "UPDATE Sessions SET ACTIVE = 0 WHERE SessionId = @SessionId";
                                using (var command = new SqlCommand(query, connection))
                                {
                                    command.Parameters.AddWithValue("@SessionId", sessionId);
                                    command.ExecuteNonQuery();
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("Error marking session inactive: " + ex.Message);
                            throw;
                        }
                    }
                [HttpGet("verifyToken")]
                [Authorize]
                public IActionResult VerifyToken()
                    {
                        try
                        {
                            var sessionId = User?.FindFirst("SessionId")?.Value;

                            if (string.IsNullOrEmpty(sessionId))
                            {
                                return Unauthorized(new { message = "Netinkamas sesijos id arba token" });
                            }
                            using (var connection = _connectionProvider.GetConnection())
                            {
                                connection.Open();
                                var query = "SELECT UserId FROM Sessions WHERE SessionId = @SessionId";

                                using (var command = new SqlCommand(query, connection))
                                {
                                    command.Parameters.AddWithValue("@SessionId", sessionId);

                                    var userId = command.ExecuteScalar()?.ToString();
                                    if (string.IsNullOrEmpty(userId))
                                    {
                                        return Unauthorized(new { message = "Session not found or invalid" });
                                    }
                                var newAccessToken = GenerateJwtToken(sessionId);
                                var newRefreshToken = GenerateRefreshToken();
                                SaveRefreshToken(sessionId, newRefreshToken);

                                Response.Cookies.Append("ACCESS_TOKEN", newAccessToken, new CookieOptions
                                {
                                        HttpOnly = true,
                                        Secure = true,
                                        SameSite = SameSiteMode.Strict,
                                        Expires = DateTime.UtcNow.AddMinutes(15)
                                });
                                Response.Cookies.Append("REFRESH_TOKEN", newRefreshToken, new CookieOptions
                                {
                                    HttpOnly = true,
                                    Secure = true,
                                    SameSite = SameSiteMode.Strict,
                                    Expires = DateTime.UtcNow.AddDays(7)
                                });
                                Response.Cookies.Append("SESSION_ID", sessionId, new CookieOptions
                                {
                                    HttpOnly = true, 
                                    Secure = true, 
                                    SameSite = SameSiteMode.Strict,
                                    Expires = DateTime.UtcNow.AddDays(60)
                                });

                                    return Ok(new {  isValid = true }); 
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            return StatusCode(500, new { message = "Error verifying token", details = ex.Message });
                        }
                    }
                private async Task<AppUser> CreateGoogleUser(string name, string email)
                {
                    var userId = Guid.NewGuid().ToString();

                    using (var connection = _connectionProvider.GetConnection())
                    {
                        await connection.OpenAsync();

                        var query = @"
                            INSERT INTO [USER] (UserId, EMAIL, NAME, CreatedAt, Activated, IsGoogleUser)
                            VALUES (@UserId, @Email, @Name, @CreatedAt, @Activated, @IsGoogleUser);
                        ";

                        using (var command = new SqlCommand(query, connection))
                        {
                            command.Parameters.AddWithValue("@UserId", userId);
                            command.Parameters.AddWithValue("@Email", email);
                            command.Parameters.AddWithValue("@Name", name);
                            command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                            command.Parameters.AddWithValue("@Activated", 1); 
                            command.Parameters.AddWithValue("@IsGoogleUser", true);

                            await command.ExecuteNonQueryAsync();
                        }
                    }
                    return new AppUser
                    {
                        Id = userId,
                        Email = email,
                        Name = name,
                        Activated = 1,
                        IsGoogleUser = true
                    };
                }

                [HttpPost("register")]
                [AllowAnonymous]
                public IActionResult Register([FromBody] RegisterRequest request)
                {
                  try
                    {
                     if (UserExists(request.Email))
                          {
                                                return BadRequest(new { message = "Vartotojas su tokiu el.paštu jau sukurtas" });
                                                }
                                                var USER_ID = Guid.NewGuid().ToString();
                                                using (var connection = _connectionProvider.GetConnection())
                                                {
                                                    connection.Open();
                                                    var query = @"
                                                        INSERT INTO [USER] (UserId, EMAIL, PASSWORD, CreatedAt,Activated,IsGoogleUser) 
                                                        VALUES (@USER_ID, @EMAIL, @PASSWORD, @CreatedAt,@Activated,@IsGoogleUser)
                                                    ";

                                                    var command = new SqlCommand(query, connection);
                                                    command.Parameters.AddWithValue("@USER_ID", USER_ID);
                                                    command.Parameters.AddWithValue("@EMAIL", request.Email);
                                                    command.Parameters.AddWithValue("@PASSWORD", HashPassword(request.Password));
                                                    command.Parameters.AddWithValue("@CreatedAt", DateTime.Now);
                                                    command.Parameters.AddWithValue("@Activated", 0);
                                                    command.Parameters.AddWithValue("@IsGoogleUser", false);
                                                    command.ExecuteNonQuery();
                                                }
                                                string verSessionID = CreateVerificationSession(USER_ID);
                                                string token = GenerateVerificationToken(verSessionID);
                                                SendVerificationEmail(request.Email, token, "https://localhost:5173");
                                                return Ok(new { message = "Registracija sekminga" });
                                            }
                                            catch (Exception ex)
                                            {
                                                
                                                Console.WriteLine($"Error refreshing token: {ex.Message}");
                                                    exceptionLogger.LogException(
                                                    source: "Register",
                                                    message: ex.Message,
                                                    stackTrace: ex.StackTrace
                                                );
                                                return StatusCode(500, new { message = "Registracija nepavyko" });
                  }
                                    }
                public string GenerateVerificationToken(string verificationSessionId)
                    {
                        var secretManager = new SecretManager();
                        var jwtSecretKey = secretManager.GetJwtSecretCode();
                        // const string key = "Your32ByteSecureKeyWithExactLength!";
                        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
                        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

                        var claims = new[]
                        {
                            new Claim("verificationSessionId", verificationSessionId),
                            new Claim("tokenType", "emailVerification")
                        };

                        var token = new JwtSecurityToken(
                            issuer: "https://mindaugasantique.cloud",
                            audience: "https://MindaugasAntique.lt",
                            claims: claims,
                            expires: DateTime.UtcNow.AddHours(1),
                            signingCredentials: credentials
                        );

                        return new JwtSecurityTokenHandler().WriteToken(token);
                    }
                public string CreateVerificationSession(string userId)
                {   
                     var sessionId = Guid.NewGuid().ToString(); 
                try {
                    
                    var expiresAt = DateTime.UtcNow.AddHours(24);

                    using (var connection = _connectionProvider.GetConnection())
                    {
                        connection.Open();
                        var query = @"
                            INSERT INTO VerificationSessions (VerificationSessionId, UserId, ExpiresAt)
                            VALUES (@VerificationSessionId, @UserId, @ExpiresAt)
                        ";

                        var command = new SqlCommand(query, connection);
                        command.Parameters.AddWithValue("@VerificationSessionId", sessionId);
                        command.Parameters.AddWithValue("@UserId", userId);
                        command.Parameters.AddWithValue("@ExpiresAt", expiresAt);
                        command.ExecuteNonQuery();
                    }

                    return sessionId;
                }catch(Exception ex){
                    exceptionLogger.LogException(
                    source: "Create verify sessionId",
                    message: ex.Message,
                    stackTrace: ex.StackTrace
                    );
                    return sessionId;
                }
                }
                public void DeleteVerificationSession(string verificationSessionId)
                    {   
                        try{
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                DELETE FROM VerificationSessions
                                WHERE VerificationSessionId = @VerificationSessionId
                            ";

                            var command = new SqlCommand(query, connection);
                            command.Parameters.AddWithValue("@VerificationSessionId", verificationSessionId);
                            command.ExecuteNonQuery();    
                        }
                        }catch(Exception ex){
                                exceptionLogger.LogException(
                                source: "verify email",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
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

                public async Task SendVerificationEmail(string email, string token, string frontendBaseUrl)
                    {
                        var verificationLink = $"{frontendBaseUrl}/pasto-patvirtinimas?token={token}";
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

                        // Generate the HTML email body
                        var emailBody = $@"
                            <html>
                                <body>
                                    <p>Mielas kliente,</p>
                                    <p></p>
                                    <p></p>
                                    <p>Patvirtinkite šią nuorodą:</p>
                                    <a href='{verificationLink}'>Nuorodą patvirtinti paštą</a><br>
                                    <p>Nuoroda galioja 24 valandas</p>
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

                        // Create and configure the email message
                        var message = new MimeKit.MimeMessage();
                        message.From.Add(new MimeKit.MailboxAddress("MindaugasAntique", "vytautasvilkas16@gmail.com"));
                        message.To.Add(new MimeKit.MailboxAddress("", email));
                        message.Subject = "El.pašto patvirtinimas";

                        // Create the HTML body part
                        var bodyBuilder = new MimeKit.BodyBuilder();
                        bodyBuilder.HtmlBody = emailBody;

                        // Attach the logo as an inline attachment
                        var logoAttachment = new MimeKit.MimePart("image", "png")
                        {
                            Content = new MimeKit.MimeContent(new System.IO.MemoryStream(logoBytes), MimeKit.ContentEncoding.Default),
                            ContentDisposition = new MimeKit.ContentDisposition(MimeKit.ContentDisposition.Inline),
                            ContentId = "companyLogo", // This ID is referenced in the HTML body
                            FileName = "logo.png"
                        };

                        // Add the attachment to the body
                        bodyBuilder.Attachments.Add(logoAttachment);

                        // Set the message body
                        message.Body = bodyBuilder.ToMessageBody();

                        using (var client = new MailKit.Net.Smtp.SmtpClient())
                        {
                            try
                            {
                                // Connect to Gmail's SMTP server
                                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);

                                // Authenticate with Gmail
                                await client.AuthenticateAsync("vytautasvilkas16@gmail.com", _secretManager.GetGoogleSecretCode());

                                // Send the email
                                await client.SendAsync(message);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error sending email: {ex.Message}");
                                throw;
                            }
                            finally
                            {
                                await client.DisconnectAsync(true);
                            }
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

                // public async Task SendVerificationEmail(string email, string token, string frontendBaseUrl)
                //         {
                //             var verificationLink = $"{frontendBaseUrl}/pasto-patvirtinimas?token={token}";

                //             var message = new MimeKit.MimeMessage();
                //             message.From.Add(new MimeKit.MailboxAddress("MindaugasAntiqueTest", "vytautasvilkas16@gmail.com")); 
                //             message.To.Add(new MimeKit.MailboxAddress("", email)); 
                //             message.Subject = "El.pašto patvirtinimas";

                //             message.Body = new MimeKit.TextPart("html")
                //             {
                //                 Text = $"<p>Patvirtinkite nuorodą:</p>" +
                //                     $"<a href='{verificationLink}'>Nuorodą patvirtinti paštą</a><br>" +
                //                     "<p>Ši nuorodą galioja 24 valandas</p>"
                //             };

                //             using (var client = new MailKit.Net.Smtp.SmtpClient())
                //             {
                //                 try
                //                 {
                //                     // Connect to Gmail's SMTP server
                //                     await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);

                //                     // Authenticate with Gmail
                //                     await client.AuthenticateAsync("vytautasvilkas16@gmail.com", _secretManager.GetGoogleSecretCode()); 

                //                     // Send the email
                //                     await client.SendAsync(message);
                //                 }
                //                 catch (Exception ex)
                //                 {
                //                     Console.WriteLine($"Error sending email: {ex.Message}");
                //                     throw; 
                //                 }
                //                 finally
                //                 {
                //                     await client.DisconnectAsync(true); 
                //                 }
                //             }
                //         }
                [HttpPost("resend-verification")]
                [AllowAnonymous]
                public IActionResult ResendVerification([FromBody] ResendVerificationRequest request)
                {
                    try
                    {
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                SELECT UserId, Activated
                                FROM [USER]
                                WHERE Email = @Email
                            ";

                            var command = new SqlCommand(query, connection);
                            command.Parameters.AddWithValue("@Email", request.Email);

                            using (var reader = command.ExecuteReader())
                            {
                                if (reader.Read())
                                {
                                    var userId = reader["UserId"].ToString();
                                    var activated = Convert.ToInt32(reader["Activated"]);

                                    if (activated == 1)
                                    {
                                        return BadRequest(new { message = "El. paštas jau patvirtintas." });
                                    }
                                    
                                    string verSessionID = CreateVerificationSession(userId);
                                    string token = GenerateVerificationToken(verSessionID);

                                    SendVerificationEmail(request.Email, token, "https://localhost:5173");

                                    return Ok(new { message = "Patvirtinimo el. laiškas išsiųstas iš naujo." });
                                }
                                else
                                {
                                    return BadRequest(new { message = "Vartotojas nerastas." });
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        exceptionLogger.LogException(
                            source: "Resend Verification",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                        );
                        return StatusCode(500, new { message = "Įvyko klaida siunčiant patvirtinimo el. laišką." });
                    }
                }
                [HttpGet("verify-email")]
                [Authorize]
                public IActionResult VerifyEmail()
                    {
                        var verificationSessionId = User?.FindFirst("verificationSessionId")?.Value;
                        if (string.IsNullOrEmpty(verificationSessionId))
                        {
                            return BadRequest(new { message = "Blogas tokenas" });
                        }

                        try
                        {
                            

                            if (string.IsNullOrEmpty(verificationSessionId))
                            {
                                return BadRequest(new { message = "Patvirtinimo tokenas netinkamas." });
                            }

                            using (var connection = _connectionProvider.GetConnection())
                            {
                                connection.Open();
                                var query = @"
                                    SELECT UserId, ExpiresAt
                                    FROM VerificationSessions
                                    WHERE VerificationSessionId = @VerificationSessionId
                                ";

                                var command = new SqlCommand(query, connection);
                                command.Parameters.AddWithValue("@VerificationSessionId", verificationSessionId);

                                using (var reader = command.ExecuteReader())
                                {
                                    if (!reader.Read())
                                    {
                                        return BadRequest(new { message = "Patvirtinimo sesija nerasta." });
                                    }

                                    var userId = reader["UserId"].ToString();
                                    var expiresAt = (DateTime)reader["ExpiresAt"];

                                    if (DateTime.UtcNow > expiresAt)
                                    {
                                        return Unauthorized(new { message = "Patvirtinimo tokenas pasibaigęs. Prašome užsakyti naują el. laišką." });
                                    }
                                    ActivateUser(userId);
                                    DeleteVerificationSession(verificationSessionId);

                                    return Ok(new { message = "El. paštas sėkmingai patvirtintas!" });
                                }
                            }
                        }
                        catch (SecurityTokenExpiredException)
                        {
                            return Unauthorized(new { message = "Patvirtinimo tokenas pasibaigęs. Prašome užsakyti naują el. laišką." });
                        }
                        catch (SecurityTokenException)
                        {
                            return Unauthorized(new { message = "Netinkamas tokenas. Patvirtinimas nepavyko." });
                        }
                        catch (Exception ex)
                        {
                            exceptionLogger.LogException(
                                source: "VerifyEmail",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );
                            return StatusCode(500, new { message = "Įvyko klaida patvirtinimo metu. Bandykite dar kartą vėliau." });
                        }
                    }
                public void ActivateUser(string userId)
                    {
                        try
                        {
                            using (var connection = _connectionProvider.GetConnection())
                            {
                                connection.Open();
                                var query = @"
                                    UPDATE [USER] 
                                    SET Activated = 1 
                                    WHERE UserId = @userId
                                ";

                                using (var command = new SqlCommand(query, connection))
                                {
                                    command.Parameters.AddWithValue("@userId", userId);
                                    int rowsAffected = command.ExecuteNonQuery();

                                    if (rowsAffected == 0)
                                    {
                                        Console.WriteLine("No rows were updated. User ID might be incorrect.");
                                    }
                                    
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            exceptionLogger.LogException(
                                source: "Activate User",
                                message: ex.Message,
                                stackTrace: ex.StackTrace
                            );

                            Console.WriteLine("Error activating user: " + ex.Message);
                        }
                    }
                private AppUser AuthenticateGoogleUser(string email)
                {
                    try
                    {
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();

                            var query = @"
                                SELECT UserId, Email, Activated, IsGoogleUser
                                FROM [USER] 
                                WHERE Email = @Email AND IsGoogleUser = @IsGoogleUser;
                            ";

                            using (var command = new SqlCommand(query, connection))
                            {
                                command.Parameters.AddWithValue("@Email", email);
                                command.Parameters.AddWithValue("@IsGoogleUser", 1); 

                                using (var reader = command.ExecuteReader())
                                {
                                    if (reader.Read())
                                    {
                                        return new AppUser
                                        {
                                            Id = reader["UserId"].ToString(),
                                            Email = reader["Email"].ToString(),
                                            Activated = Convert.ToInt32(reader["Activated"]),
                                            IsGoogleUser = Convert.ToBoolean(reader["IsGoogleUser"])
                                        };
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        exceptionLogger.LogException(
                            source: "AuthenticateGoogleUser",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                        );
                    }

                    // Log for debugging when no rows are found
                    exceptionLogger.LogException(
                        source: "AuthenticateGoogleUser",
                        message: "No rows found for the given email and IsGoogleUser condition.",
                        stackTrace: ""
                    );

                    return null;
                }
                private AppUser AuthenticateUser(string email, string password)
                    {
                        var hashedPassword = HashPassword(password);
                        try{
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                SELECT UserId, Email, Activated, IsGoogleUser
                                FROM [USER] 
                                WHERE Email = @Email AND Password = @Password 
                            ";

                            var command = new SqlCommand(query, connection);
                            command.Parameters.AddWithValue("@Email", email);
                            command.Parameters.AddWithValue("@Password", hashedPassword);

                            using (var reader = command.ExecuteReader())
                            {
                                if (reader.Read())
                                {
                                    return new AppUser
                                    {
                                        Id = reader["UserId"].ToString(),
                                        Email = reader["Email"].ToString(),
                                        Activated = Convert.ToInt32(reader["ACTIVATED"]),
                                        IsGoogleUser = (bool)reader["IsGoogleUser"]
                                    };
                                }
                            }
                        }
                        }catch(Exception ex){
                            exceptionLogger.LogException(
                            source: "Authenticate User",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                            );
                            return null;
                        }
                        return null;
                    }
                public static string GenerateJwtToken(string sessionId)
                    {   
                        var secretManager = new SecretManager();
                        var jwtSecretKey = secretManager.GetJwtSecretCode();
                        // const string key = "Your32ByteSecureKeyWithExactLength!";
                        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
                        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

                        var claims = new[]
                        {
                            new Claim("SessionId", sessionId), // Custom claim for SessionID
                            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                        };

                        var token = new JwtSecurityToken(
                            issuer: "https://mindaugasantique.cloud",
                            audience: "https://MindaugasAntique.lt",
                            claims: claims,
                            expires: DateTime.UtcNow.AddMinutes(15),
                            signingCredentials: credentials
                        );

                        return new JwtSecurityTokenHandler().WriteToken(token);
                    }
                private bool UserExists(string email)
                {
                    using (var connection = _connectionProvider.GetConnection())
                    {
                        connection.Open();
                        var query = @"
                            SELECT COUNT(1) 
                            FROM [USER] 
                            WHERE EMAIL = @EMAIL
                        ";
                        var command = new SqlCommand(query, connection);
                        command.Parameters.AddWithValue("@EMAIL", email);

                        var result = (int)command.ExecuteScalar();
                        return result > 0;
                    }
                }
                private string GetUserIdByEmail(string email)
                {
                    using (var connection = _connectionProvider.GetConnection())
                    {
                        connection.Open();
                        var query = @"
                            SELECT UserId
                            FROM [USER] 
                            WHERE EMAIL = @EMAIL
                        ";
                        var command = new SqlCommand(query, connection);
                        command.Parameters.AddWithValue("@EMAIL", email);

                        var reader = command.ExecuteReader();
                        if (reader.Read())
                        {
                            // Assuming UserId is a string in the database
                            return reader["UserId"].ToString();
                        }
                    }

                    // Return null if no user is found with the given email
                    return null;
                }
                private string HashPassword(string password)
                {
                    using (var sha256 = System.Security.Cryptography.SHA256.Create())
                    {
                        var bytes = System.Text.Encoding.UTF8.GetBytes(password);
                        var hash = sha256.ComputeHash(bytes);
                        return Convert.ToBase64String(hash);
                    }
                }
                private string GenerateRefreshToken()
                {
                    var randomNumber = new byte[32];
                    using (var rng = RandomNumberGenerator.Create())
                    {
                        rng.GetBytes(randomNumber);
                    }
                    return Convert.ToBase64String(randomNumber);
                }
                private void SaveRefreshToken(string SessionId, string refreshToken)
                    {   
                        
                        try{
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var command = new SqlCommand(
                                "INSERT INTO RefreshTokens (SessionId, Token, ExpiryDate) VALUES (@SessionId, @Token, @ExpiryDate)",
                                connection
                            );
                            command.Parameters.AddWithValue("@SessionId", SessionId);
                            command.Parameters.AddWithValue("@Token", refreshToken);
                            command.Parameters.AddWithValue("@ExpiryDate", DateTime.UtcNow.AddDays(7)); 
                            command.ExecuteNonQuery();
                        }
                        }catch(Exception ex){
                            exceptionLogger.LogException(
                            source: "SaveRefreshToken",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                            );
                        }
                    }                               
                private string GetResetSessionIdFromToken(string token)
                    {
                        try
                        {
                            var handler = new JwtSecurityTokenHandler();
                            var jwtToken = handler.ReadJwtToken(token);

                            // Extract the ResetSessionId from the token claims
                            var resetSessionIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "resetToken");
                            return resetSessionIdClaim?.Value;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error decoding token: {ex.Message}");
                            return null;
                        }
                    }

                [HttpPost("validateReset-token")]
                [Authorize]
                public IActionResult ValidateToken()
                {
                    try
                    {
                        var authHeader = HttpContext.Request.Headers["Authorization"].ToString();

                        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                        {
                            return BadRequest(new { message = "Trūksta autorizacijos antraštės arba neteisingas formatas" });
                        }

                        var token = authHeader.Replace("Bearer ", "").Trim();
                        var resetSessionId = GetResetSessionIdFromToken(token);

                        if (resetSessionId == null)
                        {
                            return BadRequest(new { message = "Nerastas tokenas" });
                        }

                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();
                            var query = @"
                                SELECT ExpirationDate, IsActive
                                FROM PasswordResetSession 
                                WHERE ResetSessionId = @ResetSessionId";

                            using (var command = new SqlCommand(query, connection))
                            {
                                command.Parameters.AddWithValue("@ResetSessionId", resetSessionId);

                                using (var reader = command.ExecuteReader())
                                {
                                    if (reader.Read())
                                    {
                                        var expiryDate = reader.GetDateTime(0);
                                        var isActive = reader.GetBoolean(1);
                                        if (DateTime.UtcNow > expiryDate)
                                        {
                                            return BadRequest(new { message = "Negaliojantis tokenas" });
                                        }
                                        if (!isActive)
                                        {
                                            return BadRequest(new { message = "Tokenas buvo panaudotas" });
                                        }

                                        return Ok(new { message = "Tokenas validus" });
                                    }
                                }
                            }
                        }

                        return BadRequest(new { message = "Negaliojantis tokenas!" });
                    }
                    catch (Exception ex)
                    {
                        exceptionLogger.LogException(
                            source: "validateReset-token",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                        );
                        return StatusCode(500, new { message = "Klaida" });
                    }
                }
                [HttpPost("reset-password")]
                [Authorize]
                public async Task<IActionResult> ResetPassword([FromBody] PasswordResetRequest request)
                {
                    try
                    {
                        var authHeader = HttpContext.Request.Headers["Authorization"].ToString();

                        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                        {
                            return BadRequest(new { message = "Trūksta autorizacijos antraštės arba neteisingas formatas" });
                        }

                        var token = authHeader.Replace("Bearer ", "").Trim();
                        var resetSessionId = GetResetSessionIdFromToken(token);

                        if (resetSessionId == null)
                        {
                            return BadRequest(new { message = "Negaliojantis tokenas" });
                        }

                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();

                            var tokenValidationQuery = @"
                                SELECT UserId, ExpirationDate, IsActive
                                FROM PasswordResetSession
                                WHERE ResetSessionId = @ResetSessionId";

                            string userId = null;
                            DateTime? expiryDate = null;
                            bool isActive = false;

                            using (var command = new SqlCommand(tokenValidationQuery, connection))
                            {
                                command.Parameters.AddWithValue("@ResetSessionId", resetSessionId);

                                using (var reader = await command.ExecuteReaderAsync())
                                {
                                    if (reader.Read())
                                    {
                                        userId = reader["UserId"].ToString();
                                        expiryDate = reader.GetDateTime(1);
                                        isActive = reader.GetBoolean(2);
                                    }
                                }
                            }

                            if (userId == null)
                            {
                                return BadRequest(new { message = "Negaliojantis tokenas" });
                            }

                            if (DateTime.UtcNow > expiryDate)
                            {
                                return BadRequest(new { message = "Tokenas pasibaigęs" });
                            }

                            if (!isActive)
                            {
                                return BadRequest(new { message = "Tokenas buvo panaudotas" });
                            }

                            // Hash the new password (implement `HashPassword` function)
                            var hashedPassword = HashPassword(request.NewPassword);

                            // Update the user's password
                            var updatePasswordQuery = @"
                                UPDATE [User] 
                                SET Password = @Password 
                                WHERE UserId = @UserId";

                            using (var command = new SqlCommand(updatePasswordQuery, connection))
                            {
                                command.Parameters.AddWithValue("@Password", hashedPassword);
                                command.Parameters.AddWithValue("@UserId", userId);
                                await command.ExecuteNonQueryAsync();
                            }

                            var updateTokenQuery = @"
                                UPDATE PasswordResetSession
                                SET IsActive = 0 
                                WHERE ResetSessionId = @ResetSessionId";
                            using (var command = new SqlCommand(updateTokenQuery, connection))
                            {
                                command.Parameters.AddWithValue("@ResetSessionId", resetSessionId);
                                await command.ExecuteNonQueryAsync();
                            }

                            return Ok(new { message = "Slaptažodis atnaujintas" });
                        }
                    }
                    catch (Exception ex)
                    {
                        exceptionLogger.LogException(
                            source: "reset-password",
                            message: ex.Message,
                            stackTrace: ex.StackTrace
                        );
                        return StatusCode(500, new { message = "Klaida" });
                    }
                }

                // Siusti atsiliepimams
                [HttpPost("submitAuthenticated")]
                [Authorize]
                public IActionResult SubmitAuthenticatedFeedback([FromBody] FeedbackRequest request)
                {
                    try
                    {
                        // Extract sessionId from token
                        var sessionId = User?.FindFirst("SessionId")?.Value;

                        if (string.IsNullOrEmpty(sessionId))
                        {
                            return Unauthorized(new { message = "Klaida " });
                        }

                        // Get user email based on sessionId
                        string userEmail;
                        using (var connection = _connectionProvider.GetConnection())
                        {
                            connection.Open();

                            var command = new SqlCommand(
                                @"
                                SELECT u.Email 
                                FROM Sessions s
                                INNER JOIN [USER] u ON u.UserId = s.UserId
                                WHERE s.SessionId = @SessionId",
                                connection
                            );
                            command.Parameters.AddWithValue("@SessionId", sessionId);

                            userEmail = command.ExecuteScalar()?.ToString();
                        }

                        if (string.IsNullOrEmpty(userEmail))
                        {
                            return Unauthorized(new { message = "User not found for this session" });
                        }

                        // Save feedback
                        SaveFeedback(request.FeedbackText, userEmail);

                        return Ok(new { message = "Feedback submitted successfully" });
                    }
                    catch (Exception ex)
                    {   
                        exceptionLogger.LogException(
                                    source: "SubmitAuthenticatedFeedback",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                                    );
                        return StatusCode(500, new { message = "Error submitting feedback", details = ex.Message });
                    }
                }
                [HttpPost("submitGuest")]
                [AllowAnonymous]
                public IActionResult SubmitGuestFeedback([FromBody] FeedbackRequest request)
                        {
                            try
                            {
                                SaveFeedback(request.FeedbackText, request.Email);
                                return Ok(new { message = "Feedback submitted successfully" });
                            }
                            catch (Exception ex)
                            {   
                                exceptionLogger.LogException(
                                    source: "SubmitGuestFeedback",
                                    message: ex.Message,
                                    stackTrace: ex.StackTrace
                                );
                                return StatusCode(500, new { message = "Error submitting feedback", details = ex.Message });
                            }
                        }
                private void SaveFeedback(string feedbackText, string email)
                {   
                    try{
                    using (var connection = _connectionProvider.GetConnection())
                    {
                        connection.Open();
                        var query = @"
                            INSERT INTO Feedback (FeedbackText, Email, SubmittedAt) 
                            VALUES (@FeedbackText, @Email, @SubmittedAt)
                        ";

                        var command = new SqlCommand(query, connection);
                        command.Parameters.AddWithValue("@FeedbackText", feedbackText);
                        command.Parameters.AddWithValue("@Email", (object)email ?? DBNull.Value);
                        command.Parameters.AddWithValue("@SubmittedAt", DateTime.UtcNow);
                        command.ExecuteNonQuery();
                    }
                    }catch(Exception ex){
                        throw;


                    }
                }
                }
    public class AppUser
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public int Activated { get; set; }
        public Boolean IsGoogleUser { get; set; }
    }
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
    public class RefreshTokenRequest
    {   
        public string RefreshToken { get; set; }
    }
    public class RevokeTokenRequest
    {
            public string RefreshToken { get; set; }
    }
    public class FeedbackRequest
    
        {
            public string FeedbackText { get; set; }
            public string Email { get; set; }
        }
    public class ResendVerificationRequest
        {
            public string Email { get; set; }
        }
    public class TokenValidationRequest
    {
        public string Token { get; set; }
    }
    public class PasswordResetRequest
    {
        public string NewPassword { get; set; }
    }
    public class GoogleLoginRequest
{
    public string IdToken { get; set; }
}
}
