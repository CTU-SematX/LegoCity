# Step 5: Create Dashboard Cards

Now that your data is flowing into SematX, let's create visual dashboard cards to display it beautifully.

⏱️ **Time**: 15-20 minutes  
🎯 **Goal**: Build interactive cards to visualize your entity data

## What are Dashboard Cards?

**Dashboard cards** are visual components that display your NGSI-LD entity data in various formats:

- **📊 Charts**: Line charts, bar charts, pie charts for trends
- **🗺️ Maps**: Geographic visualization of GeoProperty data
- **📈 Metrics**: Single value display with thresholds
- **📋 Tables**: Tabular data with sorting and filtering
- **🎛️ Gauges**: Progress bars, speedometers for ranges
- **📝 Lists**: Entity listings with custom formatting

## Access the Dashboard

1. Log in to your SematX dashboard:

   ```
   https://your-sematx-server.com/admin
   ```

2. Navigate to **Cards** in the left sidebar

3. Click **Create New** button

## Create a Metric Card

Let's create a simple metric card to display the current temperature.

### Step 1: Basic Information

Fill in the card details:

**Name**: `Room 101 Temperature`  
**Description** (optional): `Current temperature reading from Room 101 sensor`  
**Type**: Select **Metric**

### Step 2: Data Source

Configure which entity to display:

**Entity Type**: `TemperatureSensor`  
**Entity ID**: `urn:ngsi-ld:TemperatureSensor:room-101`  
**Attribute**: `temperature`

### Step 3: Display Configuration

Configure how the metric is displayed:

```json
{
  "label": "Current Temperature",
  "unit": "°C",
  "decimals": 1,
  "color": "#FF6B6B",
  "icon": "thermometer",
  "threshold": {
    "normal": { "min": 18, "max": 26, "color": "#51CF66" },
    "warning": { "min": 26, "max": 30, "color": "#FFA500" },
    "critical": { "min": 30, "max": 50, "color": "#FF0000" }
  }
}
```

### Step 4: Layout

**Width**: Full (12 columns)  
**Height**: Medium (200px)  
**Order**: 1

### Step 5: Save

Click **Create** to save your card.

## View Your Dashboard

1. Click **Dashboard** in the top navigation
2. You should see your temperature card displaying the current value
3. The color will change based on the threshold configuration

Example display:

```
┌──────────────────────────────────┐
│  Current Temperature             │
│                                  │
│         24.5°C                   │
│     ━━━━━━━━━━━━━━━━━━━         │
│                                  │
│  🌡️ Normal Range                │
└──────────────────────────────────┘
```

## Create a Chart Card

Now let's create a line chart to show temperature trends over time.

### Step 1: Basic Information

**Name**: `Temperature Trend`  
**Type**: Select **Chart**  
**Chart Type**: Line Chart

### Step 2: Data Source

**Entity Type**: `TemperatureSensor`  
**Entity ID**: `urn:ngsi-ld:TemperatureSensor:room-101`  
**Attributes**: `temperature`

### Step 3: Chart Configuration

```json
{
  "timeRange": "24h",
  "refreshInterval": 60,
  "xAxis": {
    "label": "Time",
    "type": "time"
  },
  "yAxis": {
    "label": "Temperature (°C)",
    "min": 15,
    "max": 35
  },
  "series": [
    {
      "name": "Temperature",
      "attribute": "temperature",
      "color": "#FF6B6B",
      "lineWidth": 2,
      "showPoints": true
    }
  ],
  "legend": {
    "show": true,
    "position": "bottom"
  },
  "tooltip": {
    "enabled": true,
    "format": "{value}°C at {time}"
  }
}
```

### Step 4: Layout

**Width**: Full (12 columns)  
**Height**: Large (400px)  
**Order**: 2

### Result

```
┌──────────────────────────────────────────────┐
│  Temperature Trend (Last 24 Hours)          │
│                                              │
│  35°C ┤                                      │
│       │              ╱╲                      │
│  30°C ┤            ╱    ╲   ╱╲              │
│       │          ╱        ╲╱  ╲             │
│  25°C ┤      ╱╲╱                ╲           │
│       │    ╱                      ╲         │
│  20°C ┤  ╱                          ╲       │
│       │╱                              ╲     │
│  15°C ┴────┬────┬────┬────┬────┬────┴──   │
│         00:00  06:00  12:00  18:00  24:00   │
│                                              │
│  ━━ Temperature                             │
└──────────────────────────────────────────────┘
```

## Create a Map Card

If your entities have location data, create a map to visualize them.

### Step 1: Basic Information

**Name**: `Sensor Locations`  
**Type**: Select **Map**

### Step 2: Data Source

**Entity Type**: `TemperatureSensor`  
**GeoProperty**: `location`  
**Filter** (optional): `status=="active"`

### Step 3: Map Configuration

```json
{
  "center": {
    "lat": 10.03,
    "lng": 105.78
  },
  "zoom": 15,
  "style": "streets",
  "markers": {
    "icon": "temperature",
    "color": "dynamic",
    "colorAttribute": "temperature",
    "colorScale": [
      { "value": 20, "color": "#0000FF" },
      { "value": 25, "color": "#00FF00" },
      { "value": 30, "color": "#FF0000" }
    ],
    "popup": {
      "template": "<b>{name}</b><br/>Temperature: {temperature}°C<br/>Battery: {batteryLevel}%"
    }
  },
  "clustering": {
    "enabled": true,
    "maxZoom": 16
  }
}
```

### Result

```
┌──────────────────────────────────────────────┐
│  🗺️  Sensor Locations                       │
│  ┌─────────────────────────────────────┐    │
│  │        🟢 (5 sensors)                │    │
│  │                                      │    │
│  │              🔴                      │    │
│  │         🟡                           │    │
│  │                   🟢                 │    │
│  │                                      │    │
│  │    🟡                                │    │
│  └─────────────────────────────────────┘    │
│  🔴 > 30°C  🟡 25-30°C  🟢 < 25°C           │
└──────────────────────────────────────────────┘
```

## Create a Table Card

Display multiple sensors in a sortable table.

### Step 1: Basic Information

**Name**: `All Sensors Status`  
**Type**: Select **Table**

### Step 2: Data Source

**Entity Type**: `TemperatureSensor`  
**Limit**: 100  
**Sort By**: `name`

### Step 3: Table Configuration

```json
{
  "columns": [
    {
      "field": "name",
      "header": "Sensor Name",
      "width": "40%",
      "sortable": true
    },
    {
      "field": "temperature",
      "header": "Temperature",
      "width": "20%",
      "sortable": true,
      "format": "{value}°C",
      "align": "right"
    },
    {
      "field": "batteryLevel",
      "header": "Battery",
      "width": "20%",
      "sortable": true,
      "format": "{value}%",
      "align": "right",
      "colorize": {
        "< 20": "#FF0000",
        "< 50": "#FFA500",
        ">= 50": "#51CF66"
      }
    },
    {
      "field": "status",
      "header": "Status",
      "width": "20%",
      "badge": {
        "active": { "text": "Active", "color": "green" },
        "inactive": { "text": "Inactive", "color": "red" },
        "maintenance": { "text": "Maintenance", "color": "orange" }
      }
    }
  ],
  "pagination": {
    "enabled": true,
    "pageSize": 20
  },
  "search": {
    "enabled": true,
    "placeholder": "Search sensors..."
  },
  "actions": [
    {
      "label": "View Details",
      "icon": "eye",
      "link": "/entities/{id}"
    }
  ]
}
```

### Result

```
┌───────────────────────────────────────────────────────┐
│  All Sensors Status                 🔍 Search...       │
├─────────────────┬────────────┬─────────┬─────────────┤
│ Sensor Name     │ Temperature│ Battery │ Status      │
├─────────────────┼────────────┼─────────┼─────────────┤
│ Room 101        │    24.5°C  │   85%   │ 🟢 Active   │
│ Room 102        │    23.8°C  │   42%   │ 🟢 Active   │
│ Room 103        │    25.2°C  │   15%   │ 🟠 Active   │
│ Lobby           │    22.1°C  │   78%   │ 🟢 Active   │
│ Parking         │    28.5°C  │    5%   │ 🔴 Active   │
└─────────────────┴────────────┴─────────┴─────────────┘
│ Showing 1-5 of 12                        < 1 2 3 >   │
└───────────────────────────────────────────────────────┘
```

## Create Multi-Series Chart

Compare multiple sensors on one chart.

### Configuration

```json
{
  "title": "Temperature Comparison",
  "timeRange": "24h",
  "yAxis": {
    "label": "Temperature (°C)",
    "min": 15,
    "max": 35
  },
  "series": [
    {
      "name": "Room 101",
      "entityId": "urn:ngsi-ld:TemperatureSensor:room-101",
      "attribute": "temperature",
      "color": "#FF6B6B"
    },
    {
      "name": "Room 102",
      "entityId": "urn:ngsi-ld:TemperatureSensor:room-102",
      "attribute": "temperature",
      "color": "#4ECDC4"
    },
    {
      "name": "Room 103",
      "entityId": "urn:ngsi-ld:TemperatureSensor:room-103",
      "attribute": "temperature",
      "color": "#95E1D3"
    }
  ],
  "legend": {
    "show": true,
    "position": "bottom"
  }
}
```

## Real-Time Updates

### Enable Auto-Refresh

Configure cards to update automatically:

```json
{
  "autoRefresh": {
    "enabled": true,
    "interval": 30,
    "showIndicator": true
  }
}
```

**Intervals**:

- **10 seconds**: Real-time critical data
- **30 seconds**: Active monitoring
- **60 seconds**: Normal updates
- **5 minutes**: Slow-changing data

### WebSocket Subscriptions

For instant updates, enable WebSocket subscriptions:

```json
{
  "realtime": {
    "enabled": true,
    "transport": "websocket",
    "fallbackInterval": 60
  }
}
```

## Card Layouts

### Grid System

Dashboard uses a 12-column grid:

```
┌──────────────────────────────────────────┐
│ Card A (12 cols)                         │  Full width
├──────────────────────┬───────────────────┤
│ Card B (6 cols)      │ Card C (6 cols)   │  Half width each
├──────────────────────┴───────────────────┤
│ Card D (4 cols) │ E (4 cols) │ F (4)     │  Third width each
└──────────────────────────────────────────┘
```

### Responsive Layouts

Cards adapt to screen size:

- **Desktop**: Full grid layout
- **Tablet**: 6-12 columns
- **Mobile**: Stacked (all 12 columns)

## Dashboard Organization

### Create Multiple Dashboards

Organize cards into different dashboards:

- **Overview**: High-level metrics and KPIs
- **Monitoring**: Detailed charts and tables
- **Locations**: Map-based views
- **Alerts**: Status and notification cards

### Share Dashboards

Share dashboards with team members:

1. Click **Share** button on dashboard
2. Set permissions: View only or Edit
3. Generate share link
4. Set expiration date (optional)

## Best Practices

### Performance

✅ **Do**:

- Limit entities per card (< 100 for tables)
- Use reasonable refresh intervals (≥ 30s)
- Enable pagination for large datasets
- Cache frequently accessed data

❌ **Don't**:

- Load thousands of entities in one card
- Refresh every second (causes high load)
- Create too many real-time subscriptions
- Use complex queries in high-frequency cards

### User Experience

✅ **Do**:

- Use consistent color schemes
- Provide clear labels and units
- Show loading states
- Handle errors gracefully
- Use appropriate chart types for data

❌ **Don't**:

- Use too many colors (< 5 per chart)
- Overcrowd dashboards (< 10 cards)
- Use misleading visualizations
- Ignore mobile responsiveness

### Data Visualization

**Choose the right card type**:

| Data Type         | Best Card Type |
| ----------------- | -------------- |
| Single value      | Metric         |
| Trend over time   | Line chart     |
| Comparison        | Bar chart      |
| Proportion        | Pie chart      |
| Geographic        | Map            |
| Multiple entities | Table          |
| Ranges            | Gauge          |

## Troubleshooting

### Card Shows "No Data"

**Problem**: Card displays "No data available"

**Solutions**:

1. **Check entity exists**: Verify entity ID is correct
2. **Check permissions**: Ensure API key has read access
3. **Check service**: Verify correct NGSILD-Tenant
4. **Check attribute**: Ensure attribute name matches entity

### Card Not Updating

**Problem**: Card shows old data

**Solutions**:

1. **Check refresh interval**: May be too long
2. **Check entity updates**: Verify data is being pushed
3. **Clear cache**: Refresh browser or clear cache
4. **Check WebSocket**: Connection may be dropped

### Performance Issues

**Problem**: Dashboard loads slowly

**Solutions**:

1. **Reduce entity count**: Limit queries with pagination
2. **Increase refresh interval**: Reduce update frequency
3. **Optimize queries**: Use filters to reduce data
4. **Split dashboards**: Create multiple focused dashboards

## What You Learned

✅ How to create different types of dashboard cards  
✅ How to configure card data sources  
✅ How to customize card appearance  
✅ Real-time update patterns  
✅ Dashboard organization strategies  
✅ Performance optimization techniques  
✅ Best practices for data visualization

## Next Step

Now let's set up subscriptions to receive real-time notifications:

[**Step 6: Set Up Subscriptions →**](6-subscriptions.md)

---

**Need to go back?** Return to [Step 4: Push Data](4-push-data.md)
