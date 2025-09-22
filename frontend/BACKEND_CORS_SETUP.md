# Backend CORS Configuration for Network Access

## Problem
When accessing the frontend via network IP (192.168.1.10:3000), the browser blocks API requests to the backend due to CORS policy.

## Solution
Configure your ASP.NET Core backend to allow requests from the network IP.

## Backend Configuration (ASP.NET Core)

### 1. Update Program.cs or Startup.cs

Add CORS configuration to allow requests from both localhost and network IP:

```csharp
// In Program.cs (ASP.NET Core 6+)
var builder = WebApplication.CreateBuilder(args);

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",     // Local development
                "http://127.0.0.1:3000",     // Alternative localhost
                "http://192.168.1.10:3000"   // Network access - UPDATE THIS IP TO MATCH YOUR NETWORK
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Use CORS middleware (IMPORTANT: Must be before other middleware)
app.UseCors("AllowFrontend");

// Other middleware...
app.UseAuthentication();
app.UseAuthorization();
```

### 2. Alternative: Allow Any Origin (Development Only)

⚠️ **WARNING**: Only use this for development, never in production!

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCors", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Use the policy
app.UseCors("DevelopmentCors");
```

### 3. Configure Backend to Listen on Network Interface

Make sure your ASP.NET Core backend listens on all network interfaces:

#### Option A: Update launchSettings.json
```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://0.0.0.0:5145",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

#### Option B: Use dotnet run with specific URL
```bash
dotnet run --urls "http://0.0.0.0:5145"
```

## Network Configuration

### Find Your Network IP
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

### Update Frontend Configuration
The frontend is already configured to use `192.168.1.10:5145` as the API base URL.

If your network IP is different, update `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://YOUR_NETWORK_IP:5145/api
```

## Testing

1. **Start Backend**: Make sure it's listening on `0.0.0.0:5145` or `192.168.1.10:5145`
2. **Start Frontend**: `npm run dev`
3. **Test Localhost**: Visit `http://localhost:3000`
4. **Test Network**: Visit `http://192.168.1.10:3000` from any device on the network

## Troubleshooting

### Check Backend is Accessible
```bash
# Test if backend is reachable from network
curl http://192.168.1.10:5145/api/patients
```

### Check CORS Headers
Open browser dev tools and check if these headers are present in API responses:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

### Firewall
Make sure your firewall allows connections on port 5145:

#### macOS
```bash
# Add firewall rule if needed
sudo pfctl -f /etc/pf.conf
```

#### Windows
```cmd
# Add firewall rule
netsh advfirewall firewall add rule name="ASP.NET Core API" dir=in action=allow protocol=TCP localport=5145
```

## Production Notes

In production, replace the specific IPs with your actual domain:
```csharp
.WithOrigins("https://yourdomain.com")
```

Never use `AllowAnyOrigin()` in production!