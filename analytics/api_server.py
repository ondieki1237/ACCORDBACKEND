"""
Analytics API Server
Persistent Flask server that provides live analytics data
"""

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from datetime import datetime, timedelta
import pandas as pd
from database import AccordDatabase
from sales_analytics import SalesAnalytics
from predictive_analytics import PredictiveAnalytics
from visualizations import Visualizations
import os
import json
from threading import Lock
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Thread lock for concurrent requests
data_lock = Lock()

# Cache for database connection
db = None
sales_analytics = None
predictive_analytics = None
visualizer = None

def get_db():
    """Get or create database connection"""
    global db, sales_analytics, predictive_analytics, visualizer
    
    if db is None:
        db = AccordDatabase()
        sales_analytics = SalesAnalytics(db)
        predictive_analytics = PredictiveAnalytics(db)
        visualizer = Visualizations(db)
    
    return db, sales_analytics, predictive_analytics, visualizer

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Analytics API'
    })

@app.route('/api/analytics/live/summary', methods=['GET'])
def get_live_summary():
    """Get live sales summary"""
    try:
        days_back = int(request.args.get('daysBack', 30))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            summary = sales.get_sales_performance_summary(days_back=days_back)
        
        return jsonify({
            'success': True,
            'data': summary,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting live summary: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/conversion', methods=['GET'])
def get_live_conversion():
    """Get live conversion funnel"""
    try:
        days_back = int(request.args.get('daysBack', 30))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            funnel = sales.analyze_conversion_funnel(days_back=days_back)
        
        return jsonify({
            'success': True,
            'data': funnel,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting conversion data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/regional', methods=['GET'])
def get_live_regional():
    """Get live regional performance"""
    try:
        days_back = int(request.args.get('daysBack', 30))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            regional = sales.analyze_regional_performance(days_back=days_back)
        
        # Convert DataFrame to dict for JSON
        if isinstance(regional, pd.DataFrame):
            regional_data = regional.to_dict('records')
        else:
            regional_data = regional
        
        return jsonify({
            'success': True,
            'data': regional_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting regional data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/top-performers', methods=['GET'])
def get_live_top_performers():
    """Get live top performers"""
    try:
        days_back = int(request.args.get('daysBack', 30))
        top_n = int(request.args.get('topN', 10))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            top_performers = sales.identify_top_performers(
                days_back=days_back,
                top_n=top_n
            )
        
        return jsonify({
            'success': True,
            'data': top_performers,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting top performers: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/predictions', methods=['GET'])
def get_live_predictions():
    """Get live predictive analytics"""
    try:
        days_back = int(request.args.get('daysBack', 90))  # Need more data for predictions
        
        with data_lock:
            db, sales, pred, viz = get_db()
            
            # Get predictions
            revenue_forecast = pred.forecast_revenue(days_back=days_back)
            churn_risks = pred.detect_churn_risk(days_back=days_back)
            high_value_opps = pred.identify_high_value_opportunities(days_back=days_back)
        
        return jsonify({
            'success': True,
            'data': {
                'revenue_forecast': revenue_forecast,
                'churn_risks': churn_risks,
                'high_value_opportunities': high_value_opps
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/dashboard', methods=['GET'])
def get_live_dashboard():
    """Get complete live dashboard data"""
    try:
        days_back = int(request.args.get('daysBack', 30))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            
            # Get all analytics data
            summary = sales.get_sales_performance_summary(days_back=days_back)
            funnel = sales.analyze_conversion_funnel(days_back=days_back)
            regional = sales.analyze_regional_performance(days_back=days_back)
            top_performers = sales.identify_top_performers(days_back=days_back, top_n=10)
        
        # Convert DataFrame to dict if needed
        if isinstance(regional, pd.DataFrame):
            regional = regional.to_dict('records')
        
        return jsonify({
            'success': True,
            'data': {
                'summary': summary,
                'conversion_funnel': funnel,
                'regional_performance': regional,
                'top_performers': top_performers
            },
            'timestamp': datetime.now().isoformat(),
            'period': f'Last {days_back} days'
        })
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/realtime-stats', methods=['GET'])
def get_realtime_stats():
    """Get real-time statistics (today's data)"""
    try:
        with data_lock:
            db, sales, pred, viz = get_db()
            
            # Get today's data
            today = datetime.now()
            start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Fetch today's visits and orders
            visits_df = db.get_visits(days_back=1)
            orders_df = db.get_orders(days_back=1)
            
            # Calculate today's stats
            today_stats = {
                'visits_today': len(visits_df),
                'orders_today': len(orders_df),
                'revenue_today': orders_df['totalAmount'].sum() if not orders_df.empty else 0,
                'successful_visits': len(visits_df[visits_df['outcome'] == 'successful']) if not visits_df.empty else 0,
                'active_users': len(visits_df['userId'].unique()) if not visits_df.empty else 0
            }
            
            # Add conversion rate
            if today_stats['visits_today'] > 0:
                today_stats['conversion_rate_today'] = (
                    today_stats['successful_visits'] / today_stats['visits_today'] * 100
                )
            else:
                today_stats['conversion_rate_today'] = 0
        
        return jsonify({
            'success': True,
            'data': today_stats,
            'timestamp': datetime.now().isoformat(),
            'date': today.strftime('%Y-%m-%d')
        })
    except Exception as e:
        logger.error(f"Error getting realtime stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/chart/<chart_type>', methods=['GET'])
def get_live_chart(chart_type):
    """Generate and return live chart"""
    try:
        days_back = int(request.args.get('daysBack', 30))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            
            output_dir = 'output/charts'
            os.makedirs(output_dir, exist_ok=True)
            
            chart_path = None
            
            if chart_type == 'performance':
                chart_path = viz.plot_sales_performance_comparison(
                    days_back=days_back,
                    output_dir=output_dir
                )
            elif chart_type == 'heatmap':
                chart_path = viz.plot_regional_heatmap(
                    days_back=days_back,
                    output_dir=output_dir
                )
            elif chart_type == 'funnel':
                chart_path = viz.plot_conversion_funnel(
                    days_back=days_back,
                    output_dir=output_dir
                )
            elif chart_type == 'trends':
                chart_path = viz.plot_sales_trends(
                    days_back=days_back,
                    output_dir=output_dir
                )
            else:
                return jsonify({
                    'success': False,
                    'error': 'Invalid chart type'
                }), 400
        
        if chart_path and os.path.exists(chart_path):
            return send_file(chart_path, mimetype='image/png')
        else:
            return jsonify({
                'success': False,
                'error': 'Chart generation failed'
            }), 500
            
    except Exception as e:
        logger.error(f"Error generating chart: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/live/users-activity', methods=['GET'])
def get_users_activity():
    """Get live user activity data"""
    try:
        days_back = int(request.args.get('daysBack', 7))
        
        with data_lock:
            db, sales, pred, viz = get_db()
            
            visits_df = db.get_visits(days_back=days_back)
            users_df = db.get_users()
            
            if visits_df.empty:
                return jsonify({
                    'success': True,
                    'data': [],
                    'timestamp': datetime.now().isoformat()
                })
            
            # Merge to get user details
            activity = visits_df.merge(
                users_df[['_id', 'name', 'role', 'region']],
                left_on='userId',
                right_on='_id',
                how='left'
            )
            
            # Group by user
            user_activity = activity.groupby('userId').agg({
                'name': 'first',
                'role': 'first',
                'region': 'first',
                '_id': 'count'  # Visit count
            }).reset_index()
            
            user_activity.columns = ['userId', 'name', 'role', 'region', 'visit_count']
            user_activity = user_activity.sort_values('visit_count', ascending=False)
            
            result = user_activity.to_dict('records')
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting user activity: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('ANALYTICS_PORT', 5001))
    
    logger.info(f"Starting Analytics API Server on port {port}")
    logger.info(f"Connecting to MongoDB...")
    
    # Test database connection on startup
    try:
        test_db = AccordDatabase()
        logger.info("✓ MongoDB connection successful")
    except Exception as e:
        logger.error(f"✗ MongoDB connection failed: {e}")
        exit(1)
    
    # Run Flask server
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,  # Set to False in production
        threaded=True
    )
