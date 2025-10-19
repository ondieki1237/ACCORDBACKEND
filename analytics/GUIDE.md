# ACCORD Medical Analytics - Complete Guide

## 🎯 What This Framework Does

This Python analytics framework connects to your ACCORD Medical MongoDB database and provides:

### 1. **Performance Analytics**
- Track individual sales personnel performance
- Compare team members across metrics
- Analyze regional performance
- Monitor target achievement

### 2. **Business Intelligence**
- Conversion funnel analysis
- Client type profitability analysis
- Revenue trends and patterns
- Territory coverage analysis

### 3. **Predictive Analytics**
- Revenue forecasting using machine learning
- Visit success prediction models
- Identify high-value sales opportunities
- Churn risk detection
- Next best action recommendations

### 4. **Visualizations & Reports**
- Interactive HTML dashboards
- Static charts (PNG)
- Excel reports with multiple sheets
- Time series trends
- Heatmaps and distributions

---

## 🚀 Getting Started

### Step 1: Setup Environment

```bash
cd /home/seth/Documents/code/ACCORD/ACCORDBACKEND/analytics

# Run the setup script
./setup.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Test Connection

```bash
# Activate virtual environment
source venv/bin/activate

# Run quick start test
python quick_start.py
```

This will:
- Test database connection
- Show basic statistics
- Display top performers
- Show conversion funnel
- Display regional breakdown

### Step 3: Run Full Analytics

```bash
# Run comprehensive analysis (last 30 days)
python main.py

# Or specify custom time period (e.g., last 60 days)
python main.py 60
```

This generates:
- Console report with all metrics
- PNG charts in `reports/` folder
- Interactive HTML dashboards
- Excel workbook with all data

---

## 📊 Key Analytics Available

### 1. Sales Performance Metrics

**Per Sales Person:**
- Total visits and success rate
- Number of orders and revenue
- Conversion rate (visits → orders)
- Distance traveled
- Average visits per day
- Unique clients visited
- Total contacts made

**Example Query:**
```python
from database import AccordDatabase
from sales_analytics import SalesAnalytics
from datetime import datetime, timedelta

db = AccordDatabase()
analytics = SalesAnalytics(db)

end_date = datetime.now()
start_date = end_date - timedelta(days=30)

# Get performance summary
performance = analytics.get_sales_performance_summary(start_date, end_date)
print(performance)
```

### 2. Conversion Funnel

Tracks progression through sales stages:
1. Total Visits
2. Successful Visits (outcome = successful)
3. Visits with Equipment Requests
4. Orders Placed
5. Orders Delivered

**Conversion Rates:**
- Visit success rate
- Request rate (% visits with requests)
- Visit-to-order conversion
- Order delivery rate

### 3. Regional Analysis

Compare performance across regions:
- Total visits per region
- Revenue per region
- Success rates by region
- Sales personnel count
- Unique clients per region

### 4. Client Type Analysis

Understand which client types are most valuable:
- Hospitals, Clinics, Pharmacies, Labs, etc.
- Total visits by type
- Average potential value
- Request rates
- Success rates

### 5. Target Achievement

Compare actual vs target for each sales person:
- Visit targets vs achieved
- Order targets vs achieved
- Revenue targets vs achieved
- Achievement percentages

### 6. Revenue Forecasting

Machine learning predictions for:
- Next 3 months revenue
- Based on historical patterns
- Confidence levels

### 7. Opportunity Identification

Find high-value opportunities:
- Recent visits with equipment requests
- High potential value (75th percentile+)
- Follow-up status
- Client details

### 8. Churn Risk Analysis

Identify clients at risk:
- No visits in 60+ days = Medium risk
- No visits in 90+ days = High risk
- No visits in 120+ days = Critical risk

### 9. Visit Success Prediction

ML model trained on:
- Client type
- Visit purpose
- Number of contacts
- Existing equipment
- Time of day/week
- Visit duration

Predicts likelihood of successful visit outcome.

---

## 🎨 Visualizations

### Charts Generated

1. **Performance Comparison** (PNG)
   - Revenue by sales person
   - Visits by sales person
   - Conversion rates
   - Success rates

2. **Regional Heatmap** (PNG)
   - Normalized scores across metrics
   - Color-coded performance

3. **Conversion Funnel** (HTML)
   - Interactive funnel chart
   - Hover for details

4. **Time Series Trends** (PNG)
   - Daily visits over time
   - Daily orders over time
   - Trend lines

5. **Client Distribution** (PNG)
   - Pie charts by client type
   - Visits and revenue potential

6. **Interactive Dashboard** (HTML)
   - Multiple charts in one view
   - Fully interactive with Plotly

---

## 💡 Use Cases & Decisions

### For Sales Managers

**Question: Who are my top performers?**
```python
top_performers = analytics.identify_top_performers(
    start_date, end_date, 
    metric='total_revenue', 
    top_n=10
)
```

**Question: Which regions need support?**
```python
regional = analytics.analyze_regional_performance(start_date, end_date)
# Look for low success_rate or conversion_rate
```

**Question: Are we meeting targets?**
```python
achievements = analytics.calculate_achievement_vs_targets()
# Check achievement_pct columns
```

### For Business Intelligence

**Question: What's our conversion rate?**
```python
funnel = analytics.analyze_conversion_funnel(start_date, end_date)
print(f"Conversion: {funnel['visit_to_order_rate']:.2f}%")
```

**Question: Which client types are most profitable?**
```python
client_analysis = analytics.analyze_client_types(start_date, end_date)
# Sort by avg_potential_value or total_potential_value
```

**Question: What's our revenue forecast?**
```python
from predictive_analytics import PredictiveAnalytics
predictive = PredictiveAnalytics(db)
forecast = predictive.predict_revenue_forecast(months_ahead=3)
```

### For Sales Personnel

**Question: Which clients should I follow up with?**
```python
recommendations = predictive.recommend_next_best_actions(user_id)
# Returns prioritized list of actions
```

**Question: Which opportunities have highest value?**
```python
opportunities = predictive.identify_high_value_opportunities()
# Focus on top rows
```

**Question: Which clients might we lose?**
```python
at_risk = predictive.predict_churn_risk()
# Critical and High risk clients need immediate attention
```

---

## 📈 Interpreting Results

### Good Performance Indicators
- ✅ Success rate > 80%
- ✅ Conversion rate > 10%
- ✅ Target achievement > 90%
- ✅ Regular client engagement (< 30 days)

### Warning Signs
- ⚠️ Success rate < 60%
- ⚠️ Conversion rate < 5%
- ⚠️ Target achievement < 70%
- ⚠️ Clients not visited in 60+ days

### Critical Issues
- 🚨 Success rate < 40%
- 🚨 Conversion rate < 3%
- 🚨 Target achievement < 50%
- 🚨 Multiple clients not visited in 90+ days

---

## 🔧 Customization

### Change Date Ranges

```python
# Last week
start_date = datetime.now() - timedelta(days=7)

# Last month
start_date = datetime.now() - timedelta(days=30)

# Last quarter
start_date = datetime.now() - timedelta(days=90)

# Specific dates
start_date = datetime(2025, 9, 1)
end_date = datetime(2025, 9, 30)
```

### Filter by User

```python
# Get specific user's data
user_id = "6734567890abcdef12345678"
visits = db.get_visits(start_date, end_date, user_id=user_id)
```

### Filter by Region

```python
# Get users in specific region
users = db.get_users(role='sales')
nairobi_users = users[users['region'] == 'Nairobi']
```

### Adjust Thresholds

```python
# High-value threshold (90th percentile instead of 75th)
opportunities = predictive.identify_high_value_opportunities(
    threshold_percentile=90
)

# Top N performers (top 20 instead of 10)
top = analytics.identify_top_performers(
    start_date, end_date,
    metric='total_revenue',
    top_n=20
)
```

---

## 📊 Sample Output

```
================================================================================
  ACCORD MEDICAL ANALYTICS REPORT
================================================================================

Report Period: 2025-09-19 to 2025-10-19
Days Analyzed: 30

Overall Metrics:
  Total Visits: 342
  Successful Visits: 287
  Total Orders: 45
  Total Revenue: KES 12,450,000.00
  Average Success Rate: 83.92%
  Average Conversion Rate: 13.16%

Top 5 Performers by Revenue:
name                  region    total_revenue  total_orders  conversion_rate
John Kamau           Nairobi    3,450,000.00            12            15.79
Mary Wanjiku         Mombasa    2,890,000.00            10            13.51
Peter Otieno         Kisumu     2,340,000.00             8            12.12
Jane Mwangi          Nairobi    1,780,000.00             7            11.67
David Ochieng        Nakuru     1,560,000.00             5            10.20

CONVERSION FUNNEL:
Total Visits: 342
  ↓ Success Rate: 83.92%
Successful Visits: 287
  ↓ Request Rate: 45.61%
Visits with Equipment Requests: 156
  ↓ Conversion Rate: 13.16%
Total Orders: 45
  ↓ Delivery Rate: 82.22%
Delivered Orders: 37

HIGH-VALUE OPPORTUNITIES:
Total High-Value Opportunities: 23
Total Potential Value: KES 18,750,000.00

CHURN RISK:
Clients at Risk: 15
Critical Risk: 5 clients (90+ days)
High Risk: 10 clients (60-89 days)
```

---

## 🐛 Troubleshooting

### "Connection Refused"
- Check MongoDB URI in `.env`
- Verify network connectivity
- Ensure IP is whitelisted in MongoDB Atlas

### "No Data Available"
- Check date ranges are correct
- Verify data exists for time period
- Ensure you're querying the right database

### "Module Not Found"
- Activate virtual environment: `source venv/bin/activate`
- Reinstall requirements: `pip install -r requirements.txt`

### "Permission Denied"
- Make setup.sh executable: `chmod +x setup.sh`
- Check file permissions in analytics folder

---

## 🎓 Next Steps

1. **Regular Reporting**: Schedule weekly/monthly analytics runs
2. **Custom Metrics**: Add business-specific KPIs
3. **Alerts**: Set up automated alerts for critical issues
4. **Integration**: Connect to other systems (email, Slack, etc.)
5. **Advanced ML**: Train more sophisticated models with more data

---

## 📞 Support

For questions or issues:
1. Check README.md
2. Review example scripts
3. Contact development team

---

**Created**: October 2025  
**Version**: 1.0.0  
**License**: MIT - ACCORD Medical
