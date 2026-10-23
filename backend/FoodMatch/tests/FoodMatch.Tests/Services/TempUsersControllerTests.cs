using System.Security.Claims;
using FoodMatch.Api.Controllers;
using FoodMatch.Api.Services;
using FoodMatch.Application.DTOs.TempUser;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class TempUsersControllerTests
{
    [Fact]
    public async Task MissingCoordinateDoesNotOverwriteStoredLocationWithZero()
    {
        var userId = Guid.NewGuid();
        var users = new Mock<ITempUserService>();
        var controller = new TempUsersController(users.Object,
            new Mock<IJwtTokenGenerator>().Object, new Mock<ICaptchaVerifier>().Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"))
            }
        };

        var result = await controller.UpdateLocation(userId,
            new UpdateLocationDto { Lat = 10.123456789 });

        Assert.IsType<BadRequestObjectResult>(result);
        users.Verify(service => service.UpdateLocationAsync(
            It.IsAny<Guid>(), It.IsAny<double>(), It.IsAny<double>()), Times.Never);
    }
}
