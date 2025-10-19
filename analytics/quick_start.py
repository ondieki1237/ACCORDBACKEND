"""
Quick Start Example - ACCORD Analytics

This script demonstrates basic usage of the analytics framework.
Run this after setting up the environment to test the connection.
"""

from datetime import datetime, timedelta
from database import AccordDatabase
from sales_analytics import SalesAnalytics

def quick_analysis():
    """Run a quick analysis to test the setup"""
    
    print("\n" + "="*60)
    print("  ACCORD MEDICAL - QUICK ANALYTICS TEST")
    print("="*60 + "\n")
    
    # Connect to database
    print("Connecting to database...")
    try:
        db = AccordDatabase()
        print("✓ Database connection successful!\n")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("\nPlease check:")
        print("1. MongoDB URI in ../project/.env file")
        print("2. Your IP is whitelisted in MongoDB Atlas")
        print("3. Database credentials are correct")
        return
    
    # Initialize analytics
    analytics = SalesAnalytics(db)
    
    # Set date range (last 7 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    print(f"Analyzing data from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print("-" * 60)
    
    # 1. Get basic statistics
    print("\n📊 BASIC STATISTICS:")
    
    try:
        # Users
        users = db.get_users(role='sales')
        print(f"  Sales Personnel: {len(users)}")
        
        # Visits
        visits = db.get_visits(start_date, end_date)
        print(f"  Visits (last 7 days): {len(visits)}")
        
        # Orders
        orders = db.get_orders(start_date, end_date)
        print(f"  Orders (last 7 days): {len(orders)}")
        
        if not orders.empty and 'totalAmount' in orders.columns:
            total_revenue = orders['totalAmount'].sum()
            print(f"  Total Revenue: KES {total_revenue:,.2f}")
        
    except Exception as e:
        print(f"  Error fetching basic stats: {e}")
    
    # 2. Performance Summary
    print("\n👥 TOP 5 PERFORMERS (by visits):")
    
    try:
        performance = analytics.get_sales_performance_summary(start_date, end_date)
        
        if not performance.empty:
            top_5 = performance.nlargest(5, 'total_visits')[['name', 'region', 'total_visits', 'total_orders']]
            
            for idx, row in top_5.iterrows():
                print(f"  {row['name']:30} | Region: {row['region']:15} | Visits: {row['total_visits']:3} | Orders: {row['total_orders']:2}")
        else:
            print("  No performance data available for this period")
            
    except Exception as e:
        print(f"  Error calculating performance: {e}")
    
    # 3. Conversion Funnel
    print("\n🔄 CONVERSION FUNNEL:")
    
    try:
        funnel = analytics.analyze_conversion_funnel(start_date, end_date)
        
        if funnel:
            print(f"  Total Visits:           {funnel['total_visits']:4}")
            print(f"  Successful Visits:      {funnel['successful_visits']:4} ({funnel['visit_success_rate']:.1f}%)")
            print(f"  Visits with Requests:   {funnel['visits_with_requests']:4} ({funnel['request_rate']:.1f}%)")
            print(f"  Orders Placed:          {funnel['total_orders']:4} ({funnel['visit_to_order_rate']:.1f}%)")
            print(f"  Orders Delivered:       {funnel['delivered_orders']:4} ({funnel['order_delivery_rate']:.1f}%)")
        else:
            print("  No funnel data available")
            
    except Exception as e:
        print(f"  Error calculating funnel: {e}")
    
    # 4. Regional Performance
    print("\n🌍 REGIONAL BREAKDOWN:")
    
    try:
        regional = analytics.analyze_regional_performance(start_date, end_date)
        
        if not regional.empty:
            for _, row in regional.iterrows():
                print(f"  {row['region']:20} | Visits: {row['total_visits']:3} | Orders: {row['total_orders']:2} | Success: {row['success_rate']:.1f}%")
        else:
            print("  No regional data available")
            
    except Exception as e:
        print(f"  Error calculating regional data: {e}")
    
    # Close connection
    db.close()
    
    print("\n" + "="*60)
    print("✅ Analysis Complete!")
    print("="*60)
    print("\nTo run full analytics with visualizations:")
    print("  python main.py")
    print("\nTo run for a different time period (e.g., 30 days):")
    print("  python main.py 30")
    print()

if __name__ == "__main__":
    quick_analysis()
