"""
Main Analytics Runner
Execute comprehensive analytics and generate reports
"""

import os
from datetime import datetime, timedelta
import pandas as pd

from database import AccordDatabase
from sales_analytics import SalesAnalytics
from predictive_analytics import PredictiveAnalytics
from visualizations import Visualizations

def print_section(title):
    """Print formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def generate_comprehensive_report(days_back: int = 30):
    """
    Generate comprehensive analytics report
    
    Args:
        days_back: Number of days to analyze
    """
    # Initialize
    db = AccordDatabase()
    sales_analytics = SalesAnalytics(db)
    predictive_analytics = PredictiveAnalytics(db)
    viz = Visualizations(db)
    
    # Date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    print_section(f"ACCORD MEDICAL ANALYTICS REPORT")
    print(f"Report Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"Days Analyzed: {days_back}")
    
    # 1. SALES PERFORMANCE SUMMARY
    print_section("1. SALES PERFORMANCE SUMMARY")
    performance = sales_analytics.get_sales_performance_summary(start_date, end_date)
    
    if not performance.empty:
        print(f"Total Sales Personnel: {len(performance)}")
        print(f"\nOverall Metrics:")
        print(f"  Total Visits: {performance['total_visits'].sum():,}")
        print(f"  Successful Visits: {performance['successful_visits'].sum():,}")
        print(f"  Total Orders: {performance['total_orders'].sum():,}")
        print(f"  Total Revenue: KES {performance['total_revenue'].sum():,.2f}")
        print(f"  Total Distance Traveled: {performance['total_distance'].sum():,.2f} km")
        print(f"  Average Success Rate: {performance['success_rate'].mean():.2f}%")
        print(f"  Average Conversion Rate: {performance['conversion_rate'].mean():.2f}%")
        
        print(f"\nTop 5 Performers by Revenue:")
        top_5 = performance.nlargest(5, 'total_revenue')[['name', 'region', 'total_revenue', 'total_orders', 'conversion_rate']]
        print(top_5.to_string(index=False))
    else:
        print("No performance data available")
    
    # 2. CONVERSION FUNNEL
    print_section("2. CONVERSION FUNNEL ANALYSIS")
    funnel = sales_analytics.analyze_conversion_funnel(start_date, end_date)
    
    if funnel:
        print(f"Total Visits: {funnel['total_visits']:,}")
        print(f"  ↓ Success Rate: {funnel['visit_success_rate']:.2f}%")
        print(f"Successful Visits: {funnel['successful_visits']:,}")
        print(f"  ↓ Request Rate: {funnel['request_rate']:.2f}%")
        print(f"Visits with Equipment Requests: {funnel['visits_with_requests']:,}")
        print(f"  ↓ Conversion Rate: {funnel['visit_to_order_rate']:.2f}%")
        print(f"Total Orders: {funnel['total_orders']:,}")
        print(f"  ↓ Delivery Rate: {funnel['order_delivery_rate']:.2f}%")
        print(f"Delivered Orders: {funnel['delivered_orders']:,}")
    else:
        print("No funnel data available")
    
    # 3. REGIONAL ANALYSIS
    print_section("3. REGIONAL PERFORMANCE")
    regional = sales_analytics.analyze_regional_performance(start_date, end_date)
    
    if not regional.empty:
        print(regional.to_string(index=False))
    else:
        print("No regional data available")
    
    # 4. CLIENT TYPE ANALYSIS
    print_section("4. CLIENT TYPE ANALYSIS")
    client_types = sales_analytics.analyze_client_types(start_date, end_date)
    
    if not client_types.empty:
        print(client_types.to_string(index=False))
    else:
        print("No client type data available")
    
    # 5. TARGET ACHIEVEMENT
    print_section("5. TARGET vs ACHIEVEMENT (Current Month)")
    achievements = sales_analytics.calculate_achievement_vs_targets()
    
    if not achievements.empty:
        summary = achievements[['name', 'region', 'visits_achieved', 'visit_achievement_pct', 
                               'orders_achieved', 'order_achievement_pct', 'revenue_achieved', 
                               'revenue_achievement_pct']]
        print(summary.to_string(index=False))
        
        print(f"\n  Average Visit Achievement: {achievements['visit_achievement_pct'].mean():.2f}%")
        print(f"  Average Order Achievement: {achievements['order_achievement_pct'].mean():.2f}%")
        print(f"  Average Revenue Achievement: {achievements['revenue_achievement_pct'].mean():.2f}%")
    else:
        print("No achievement data available")
    
    # 6. REVENUE FORECAST
    print_section("6. REVENUE FORECAST (Next 3 Months)")
    forecast = predictive_analytics.predict_revenue_forecast(months_ahead=3)
    
    if not forecast.empty:
        print(forecast.to_string(index=False))
    else:
        print("Insufficient data for forecasting")
    
    # 7. HIGH-VALUE OPPORTUNITIES
    print_section("7. HIGH-VALUE OPPORTUNITIES")
    opportunities = predictive_analytics.identify_high_value_opportunities(threshold_percentile=75)
    
    if not opportunities.empty:
        print(f"Total High-Value Opportunities: {len(opportunities)}")
        print(f"Total Potential Value: KES {opportunities['potential_value'].sum():,.2f}")
        print(f"\nTop 10 Opportunities:")
        top_opps = opportunities.head(10)[['client_name', 'client_type', 'potential_value', 
                                           'num_items_requested', 'follow_up_required']]
        print(top_opps.to_string(index=False))
    else:
        print("No high-value opportunities identified")
    
    # 8. CHURN RISK ANALYSIS
    print_section("8. CHURN RISK ANALYSIS")
    churn_risk = predictive_analytics.predict_churn_risk()
    
    if not churn_risk.empty:
        print(f"Clients at Risk: {len(churn_risk)}")
        print(f"\nTop 10 At-Risk Clients:")
        at_risk = churn_risk.head(10)[['client_name', 'client_type', 'days_since_visit', 'churn_risk']]
        print(at_risk.to_string(index=False))
    else:
        print("No clients at churn risk")
    
    # 9. GENERATE VISUALIZATIONS
    print_section("9. GENERATING VISUALIZATIONS")
    
    try:
        # Create output directory
        output_dir = 'reports'
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Generate charts
        viz.plot_sales_performance_comparison(start_date, end_date, f'{output_dir}/performance_{timestamp}.png')
        viz.plot_regional_heatmap(start_date, end_date, f'{output_dir}/regional_heatmap_{timestamp}.png')
        viz.plot_conversion_funnel(start_date, end_date, f'{output_dir}/funnel_{timestamp}.html')
        viz.plot_time_series_trends(start_date, end_date, f'{output_dir}/trends_{timestamp}.png')
        viz.plot_client_type_distribution(start_date, end_date, f'{output_dir}/client_distribution_{timestamp}.png')
        viz.create_dashboard_html(start_date, end_date, f'{output_dir}/dashboard_{timestamp}.html')
        
        print(f"✓ All visualizations saved to '{output_dir}/' directory")
    except Exception as e:
        print(f"✗ Error generating visualizations: {e}")
    
    # 10. EXPORT TO EXCEL
    print_section("10. EXPORTING TO EXCEL")
    
    try:
        excel_path = f'{output_dir}/analytics_report_{timestamp}.xlsx'
        with pd.ExcelWriter(excel_path, engine='xlsxwriter') as writer:
            if not performance.empty:
                performance.to_excel(writer, sheet_name='Performance Summary', index=False)
            if not regional.empty:
                regional.to_excel(writer, sheet_name='Regional Analysis', index=False)
            if not client_types.empty:
                client_types.to_excel(writer, sheet_name='Client Types', index=False)
            if not achievements.empty:
                achievements.to_excel(writer, sheet_name='Target Achievement', index=False)
            if not opportunities.empty:
                opportunities.to_excel(writer, sheet_name='Opportunities', index=False)
            if not churn_risk.empty:
                churn_risk.to_excel(writer, sheet_name='Churn Risk', index=False)
            if not forecast.empty:
                forecast.to_excel(writer, sheet_name='Revenue Forecast', index=False)
        
        print(f"✓ Excel report saved to '{excel_path}'")
    except Exception as e:
        print(f"✗ Error exporting to Excel: {e}")
    
    # Close database connection
    db.close()
    
    print_section("REPORT GENERATION COMPLETE")
    print(f"Report generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Output directory: {output_dir}/")
    print("\n")

if __name__ == "__main__":
    import sys
    
    # Allow command line argument for days
    days_back = 30
    if len(sys.argv) > 1:
        try:
            days_back = int(sys.argv[1])
        except ValueError:
            print("Invalid days argument. Using default (30 days)")
    
    print(f"\nStarting analytics for last {days_back} days...")
    generate_comprehensive_report(days_back)
