# ACCORD Medical Analytics - Python Framework

A comprehensive Python analytics framework for ACCORD Medical backend data analysis and predictive insights.

## 📊 Features

### 1. **Sales Performance Analytics**
- Comprehensive sales personnel performance metrics
- Conversion funnel analysis
- Regional performance comparison
- Client type analysis
- Target vs achievement tracking

### 2. **Predictive Analytics**
- Revenue forecasting using machine learning
- Visit success prediction models
- High-value opportunity identification
- Churn risk analysis
- Next best action recommendations

### 3. **Data Visualizations**
- Performance comparison charts
- Regional heatmaps
- Conversion funnels
- Time series trends
- Client distribution pie charts
- Interactive HTML dashboards

## 🚀 Setup

### Prerequisites
- Python 3.8 or higher
- Access to ACCORD MongoDB database
- Environment variables configured in `project/.env`

### Installation

```bash
# Navigate to analytics directory
cd analytics

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## 📁 Project Structure

```
analytics/
│
├── database.py              # MongoDB connection and data extraction
├── sales_analytics.py       # Sales performance analysis
├── predictive_analytics.py  # ML models and predictions
├── visualizations.py        # Charts and visualizations
├── main.py                  # Main runner script
├── requirements.txt         # Python dependencies
├── README.md               # This file
│
└── reports/                # Generated reports (auto-created)
    ├── *.png              # Chart images
    ├── *.html             # Interactive dashboards
    └── *.xlsx             # Excel reports
```

## 🎯 Usage

### Quick Start

Run comprehensive analytics for the last 30 days:

```bash
python main.py
```

Run analytics for custom time period (e.g., last 60 days):

```bash
python main.py 60
```

### Individual Modules

#### 1. Database Connection

```python
from database import AccordDatabase

db = AccordDatabase()

# Get sales users
users = db.get_users(role='sales')

# Get visits from last 30 days
from datetime import datetime, timedelta
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
visits = db.get_visits(start_date, end_date)

db.close()
```

#### 2. Sales Analytics

```python
from database import AccordDatabase
from sales_analytics import SalesAnalytics
from datetime import datetime, timedelta

db = AccordDatabase()
analytics = SalesAnalytics(db)

# Get performance summary
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
performance = analytics.get_sales_performance_summary(start_date, end_date)
print(performance)

# Analyze conversion funnel
funnel = analytics.analyze_conversion_funnel(start_date, end_date)
print(funnel)

# Get regional performance
regional = analytics.analyze_regional_performance(start_date, end_date)
print(regional)

db.close()
```

#### 3. Predictive Analytics

```python
from database import AccordDatabase
from predictive_analytics import PredictiveAnalytics

db = AccordDatabase()
predictive = PredictiveAnalytics(db)

# Revenue forecast
forecast = predictive.predict_revenue_forecast(months_ahead=3)
print(forecast)

# High-value opportunities
opportunities = predictive.identify_high_value_opportunities()
print(opportunities)

# Churn risk analysis
at_risk = predictive.predict_churn_risk()
print(at_risk)

# Train visit success prediction model
model, importance = predictive.predict_visit_success()
print(importance)

db.close()
```

#### 4. Visualizations

```python
from database import AccordDatabase
from visualizations import Visualizations
from datetime import datetime, timedelta

db = AccordDatabase()
viz = Visualizations(db)

end_date = datetime.now()
start_date = end_date - timedelta(days=30)

# Generate charts
viz.plot_sales_performance_comparison(start_date, end_date, 'performance.png')
viz.plot_regional_heatmap(start_date, end_date, 'heatmap.png')
viz.plot_conversion_funnel(start_date, end_date, 'funnel.html')
viz.create_dashboard_html(start_date, end_date, 'dashboard.html')

db.close()
```

## 📈 Key Metrics

### Performance Metrics
- **Total Visits**: Number of client visits
- **Success Rate**: Percentage of successful visits
- **Conversion Rate**: Percentage of visits resulting in orders
- **Total Revenue**: Sum of all order values
- **Average Order Value**: Mean order value
- **Distance Traveled**: Total kilometers covered

### Predictive Metrics
- **Revenue Forecast**: Projected revenue for upcoming months
- **Churn Risk**: Clients at risk of churning (no recent visits)
- **Visit Success Probability**: Likelihood of visit success
- **High-Value Opportunities**: Potential deals above threshold

## 📊 Output Reports

The `main.py` script generates:

1. **Console Report**: Comprehensive text-based analysis
2. **PNG Charts**: Static visualizations
3. **HTML Dashboards**: Interactive charts
4. **Excel Report**: Multi-sheet workbook with all analytics

All outputs are saved in the `reports/` directory with timestamps.

## 🔧 Configuration

### Database Connection

The framework reads MongoDB connection from `../project/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Customization

You can modify analysis parameters in each module:

- Change date ranges
- Adjust thresholds for high-value opportunities
- Modify chart colors and styles
- Add custom metrics

## 🎓 Analytics Insights

### Decision Support

1. **Who to prioritize**: Top performers and underperformers
2. **Where to focus**: High-performing regions vs low-performing
3. **What to sell**: Client type preferences
4. **When to follow up**: Churn risk clients
5. **How to improve**: Success factors from predictive models

### Actionable Recommendations

- Identify top performers for recognition
- Support underperformers with training
- Focus on high-value opportunities
- Re-engage at-risk clients
- Optimize territory assignments
- Set realistic targets based on forecasts

## 🐛 Troubleshooting

### Common Issues

**Connection Error**:
```
Check MONGODB_URI in .env file
Ensure MongoDB Atlas IP whitelist includes your IP
```

**No Data**:
```
Verify date ranges
Check if data exists in database
Ensure user has proper role
```

**Import Errors**:
```
Activate virtual environment
Reinstall requirements: pip install -r requirements.txt
```

## 📝 Example Output

```
================================================================================
  ACCORD MEDICAL ANALYTICS REPORT
================================================================================

Report Period: 2025-09-19 to 2025-10-19
Days Analyzed: 30

================================================================================
  1. SALES PERFORMANCE SUMMARY
================================================================================

Total Sales Personnel: 15
Overall Metrics:
  Total Visits: 342
  Successful Visits: 287
  Total Orders: 45
  Total Revenue: KES 12,450,000.00
  Total Distance Traveled: 4,567.80 km
  Average Success Rate: 83.92%
  Average Conversion Rate: 13.16%

Top 5 Performers by Revenue:
...
```

## 🤝 Contributing

To add new analytics:

1. Create new method in appropriate module
2. Add tests and documentation
3. Update `main.py` to include in reports

## 📧 Support

For questions or issues, contact the ACCORD Medical development team.

## 📄 License

MIT License - ACCORD Medical

---

**Last Updated**: October 2025
**Version**: 1.0.0
