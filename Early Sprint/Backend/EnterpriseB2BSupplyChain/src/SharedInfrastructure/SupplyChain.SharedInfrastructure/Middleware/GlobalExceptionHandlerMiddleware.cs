using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SupplyChain.SharedInfrastructure.Exceptions;

namespace SupplyChain.SharedInfrastructure.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        int statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError;
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = "An unexpected error occurred.",
            Detail = "An error occurred while processing your request. Please check the logs for more details."
        };

        switch (exception)
        {
            case InvalidOperationException ex:
                // Many business layer validations throw InvalidOperationException. We treat these as a 400 Bad Request to avoid 500s.
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status400BadRequest;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Invalid Operation";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Invalid operation exception caught: {Message}", ex.Message);
                break;
            case ValidationAppException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status400BadRequest;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Validation Error";
                problemDetails.Detail = ex.Message;
                if (ex.FieldErrors != null && ex.FieldErrors.Any())
                {
                    problemDetails.Extensions["errors"] = ex.FieldErrors;
                }
                _logger.LogWarning(ex, "Validation exception caught: {Message}", ex.Message);
                break;
            case ConflictAppException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status409Conflict;
                problemDetails.Status = statusCode;
                problemDetails.Title = "State Conflict";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Conflict exception caught: {Message}", ex.Message);
                break;
            case NotFoundAppException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status404NotFound;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Resource Not Found";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "NotFound exception caught: {Message}", ex.Message);
                break;
            case UnauthorizedAppException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status401Unauthorized;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Unauthorized";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Unauthorized exception caught: {Message}", ex.Message);
                break;
            case ForbiddenAppException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status403Forbidden;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Forbidden";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Forbidden exception caught: {Message}", ex.Message);
                break;
            case AppException ex:
                statusCode = ex.StatusCode > 0 ? ex.StatusCode : Microsoft.AspNetCore.Http.StatusCodes.Status400BadRequest;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Application Error";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Application exception caught: {Message}", ex.Message);
                break;
            case UnauthorizedAccessException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status401Unauthorized;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Unauthorized";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Unauthorized access: {Message}", ex.Message);
                break;
            case ArgumentException ex:
                statusCode = Microsoft.AspNetCore.Http.StatusCodes.Status400BadRequest;
                problemDetails.Status = statusCode;
                problemDetails.Title = "Invalid Argument";
                problemDetails.Detail = ex.Message;
                _logger.LogWarning(ex, "Argument exception caught: {Message}", ex.Message);
                break;
            default:
                _logger.LogError(exception, "Unhandled system exception: {Message}", exception.Message);
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var result = JsonSerializer.Serialize(problemDetails);
        return context.Response.WriteAsync(result);
    }
}
