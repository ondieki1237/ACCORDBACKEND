"""
Sales Performance Analytics Module
Analyze sales personnel performance, conversion rates, and revenue metrics
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

from database import AccordDatabase

class SalesAnalytics:
    """Analyze sales performance metrics"""
    
    def __init__(self, db: AccordDatabase):
        self.db = db
    
    def get_sales_performance_summary(self, 
                                     start_date: datetime,
                                     end_date: datetime) -> pd.DataFrame:
        """
        Get comprehensive sales performance summary
        
        Returns:
            DataFrame with metrics per sales person
        """
        # Get data
        visits_df = self.db.get_visits(start_date, end_date)
        orders_df = self.db.get_orders(start_date, end_date)
        trails_df = self.db.get_trails(start_date, end_date)
        users_df = self.db.get_users(role='sales')
        
        if visits_df.empty or users_df.empty:
            return pd.DataFrame()
        
        # Create summary for each sales person
        summaries = []
        
        for _, user in users_df.iterrows():
            user_id = str(user['_id'])
            
            # Filter data for this user
            user_visits = visits_df[visits_df['userId'] == user_id]
            user_orders = orders_df[orders_df['userId'] == user_id] if not orders_df.empty else pd.DataFrame()
            user_trails = trails_df[trails_df['userId'] == user_id] if not trails_df.empty else pd.DataFrame()
            
            # Calculate metrics
            summary = {
                'user_id': user_id,
                'name': f"{user.get('firstName', '')} {user.get('lastName', '')}",
                'region': user.get('region', 'N/A'),
                'department': user.get('department', 'sales'),
                
                # Visit metrics
                'total_visits': len(user_visits),
                'successful_visits': len(user_visits[user_visits['visitOutcome'] == 'successful']) if 'visitOutcome' in user_visits.columns else 0,
                'success_rate': 0,
                
                # Client metrics
                'unique_clients': user_visits['client'].apply(lambda x: x.get('name') if isinstance(x, dict) else '').nunique() if not user_visits.empty else 0,
                'total_contacts': user_visits['contacts'].apply(lambda x: len(x) if isinstance(x, list) else 0).sum() if 'contacts' in user_visits.columns else 0,
                
                # Financial metrics
                'total_potential_value': user_visits['totalPotentialValue'].sum() if 'totalPotentialValue' in user_visits.columns else 0,
                'total_orders': len(user_orders),
                'total_revenue': user_orders['totalAmount'].sum() if not user_orders.empty and 'totalAmount' in user_orders.columns else 0,
                
                # Activity metrics
                'total_distance': user_trails['totalDistance'].sum() if not user_trails.empty and 'totalDistance' in user_trails.columns else 0,
                'avg_visits_per_day': 0,
                'avg_distance_per_day': 0,
                
                # Conversion metrics
                'conversion_rate': 0,
                'avg_order_value': 0,
            }
            
            # Calculate rates
            if summary['total_visits'] > 0:
                summary['success_rate'] = (summary['successful_visits'] / summary['total_visits']) * 100
            
            if summary['total_visits'] > 0 and summary['total_orders'] > 0:
                summary['conversion_rate'] = (summary['total_orders'] / summary['total_visits']) * 100
            
            if summary['total_orders'] > 0:
                summary['avg_order_value'] = summary['total_revenue'] / summary['total_orders']
            
            # Calculate daily averages
            days_active = (end_date - start_date).days + 1
            if days_active > 0:
                summary['avg_visits_per_day'] = summary['total_visits'] / days_active
                summary['avg_distance_per_day'] = summary['total_distance'] / days_active
            
            summaries.append(summary)
        
        return pd.DataFrame(summaries)
    
    def analyze_conversion_funnel(self, 
                                  start_date: datetime,
                                  end_date: datetime) -> Dict:
        """
        Analyze the sales conversion funnel
        
        Returns:
            Dictionary with funnel metrics
        """
        visits_df = self.db.get_visits(start_date, end_date)
        orders_df = self.db.get_orders(start_date, end_date)
        
        if visits_df.empty:
            return {}
        
        # Funnel stages
        total_visits = len(visits_df)
        successful_visits = len(visits_df[visits_df['visitOutcome'] == 'successful']) if 'visitOutcome' in visits_df.columns else 0
        visits_with_requests = len(visits_df[visits_df['requestedEquipment'].apply(lambda x: len(x) > 0 if isinstance(x, list) else False)]) if 'requestedEquipment' in visits_df.columns else 0
        total_orders = len(orders_df)
        delivered_orders = len(orders_df[orders_df['status'] == 'delivered']) if not orders_df.empty and 'status' in orders_df.columns else 0
        
        funnel = {
            'total_visits': total_visits,
            'successful_visits': successful_visits,
            'visits_with_requests': visits_with_requests,
            'total_orders': total_orders,
            'delivered_orders': delivered_orders,
            
            # Conversion rates
            'visit_success_rate': (successful_visits / total_visits * 100) if total_visits > 0 else 0,
            'request_rate': (visits_with_requests / total_visits * 100) if total_visits > 0 else 0,
            'visit_to_order_rate': (total_orders / total_visits * 100) if total_visits > 0 else 0,
            'order_delivery_rate': (delivered_orders / total_orders * 100) if total_orders > 0 else 0,
        }
        
        return funnel
    
    def analyze_regional_performance(self,
                                    start_date: datetime,
                                    end_date: datetime) -> pd.DataFrame:
        """
        Analyze performance by region
        
        Returns:
            DataFrame with regional metrics
        """
        visits_df = self.db.get_visits(start_date, end_date)
        orders_df = self.db.get_orders(start_date, end_date)
        users_df = self.db.get_users(role='sales')
        
        if visits_df.empty or users_df.empty:
            return pd.DataFrame()
        
        # Merge user regions into visits
        user_regions = users_df.set_index('_id')['region'].to_dict()
        visits_df['region'] = visits_df['userId'].map(user_regions)
        orders_df['region'] = orders_df['userId'].map(user_regions) if not orders_df.empty else pd.Series()
        
        # Group by region
        regional_summary = []
        
        for region in visits_df['region'].unique():
            if pd.isna(region):
                continue
            
            region_visits = visits_df[visits_df['region'] == region]
            region_orders = orders_df[orders_df['region'] == region] if not orders_df.empty else pd.DataFrame()
            
            summary = {
                'region': region,
                'total_visits': len(region_visits),
                'successful_visits': len(region_visits[region_visits['visitOutcome'] == 'successful']) if 'visitOutcome' in region_visits.columns else 0,
                'total_orders': len(region_orders),
                'total_revenue': region_orders['totalAmount'].sum() if not region_orders.empty and 'totalAmount' in region_orders.columns else 0,
                'total_potential_value': region_visits['totalPotentialValue'].sum() if 'totalPotentialValue' in region_visits.columns else 0,
                'unique_clients': region_visits['client'].apply(lambda x: x.get('name') if isinstance(x, dict) else '').nunique(),
                'sales_personnel_count': len(users_df[users_df['region'] == region]),
            }
            
            # Calculate rates
            if summary['total_visits'] > 0:
                summary['success_rate'] = (summary['successful_visits'] / summary['total_visits']) * 100
                summary['conversion_rate'] = (summary['total_orders'] / summary['total_visits']) * 100
            else:
                summary['success_rate'] = 0
                summary['conversion_rate'] = 0
            
            regional_summary.append(summary)
        
        return pd.DataFrame(regional_summary)
    
    def identify_top_performers(self,
                               start_date: datetime,
                               end_date: datetime,
                               metric: str = 'total_revenue',
                               top_n: int = 10) -> pd.DataFrame:
        """
        Identify top performing sales personnel
        
        Args:
            metric: Metric to rank by (total_revenue, total_visits, conversion_rate, etc.)
            top_n: Number of top performers to return
        
        Returns:
            DataFrame with top performers
        """
        performance_df = self.get_sales_performance_summary(start_date, end_date)
        
        if performance_df.empty:
            return pd.DataFrame()
        
        if metric not in performance_df.columns:
            print(f"Warning: Metric '{metric}' not found. Using 'total_revenue'")
            metric = 'total_revenue'
        
        top_performers = performance_df.nlargest(top_n, metric)
        
        return top_performers
    
    def analyze_client_types(self,
                            start_date: datetime,
                            end_date: datetime) -> pd.DataFrame:
        """
        Analyze performance by client type
        
        Returns:
            DataFrame with client type analysis
        """
        visits_df = self.db.get_visits(start_date, end_date)
        
        if visits_df.empty:
            return pd.DataFrame()
        
        # Extract client types
        client_types = []
        for _, visit in visits_df.iterrows():
            client = visit.get('client', {})
            if isinstance(client, dict):
                client_types.append({
                    'client_type': client.get('type', 'unknown'),
                    'visit_outcome': visit.get('visitOutcome', 'unknown'),
                    'potential_value': visit.get('totalPotentialValue', 0),
                    'has_requests': len(visit.get('requestedEquipment', [])) > 0 if isinstance(visit.get('requestedEquipment'), list) else False
                })
        
        if not client_types:
            return pd.DataFrame()
        
        client_df = pd.DataFrame(client_types)
        
        # Aggregate by client type
        summary = client_df.groupby('client_type').agg({
            'visit_outcome': 'count',
            'potential_value': 'sum',
            'has_requests': 'sum'
        }).rename(columns={
            'visit_outcome': 'total_visits',
            'potential_value': 'total_potential_value',
            'has_requests': 'visits_with_requests'
        })
        
        summary['avg_potential_value'] = summary['total_potential_value'] / summary['total_visits']
        summary['request_rate'] = (summary['visits_with_requests'] / summary['total_visits'] * 100)
        
        return summary.reset_index()
    
    def calculate_achievement_vs_targets(self) -> pd.DataFrame:
        """
        Calculate achievement percentage vs targets for sales personnel
        
        Returns:
            DataFrame with target achievement analysis
        """
        users_df = self.db.get_users(role='sales')
        
        # Get current month data
        now = datetime.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        visits_df = self.db.get_visits(start_date=start_of_month)
        orders_df = self.db.get_orders(start_date=start_of_month)
        
        achievements = []
        
        for _, user in users_df.iterrows():
            user_id = str(user['_id'])
            targets = user.get('targets', {}).get('monthly', {})
            
            user_visits = visits_df[visits_df['userId'] == user_id] if not visits_df.empty else pd.DataFrame()
            user_orders = orders_df[orders_df['userId'] == user_id] if not orders_df.empty else pd.DataFrame()
            
            achievement = {
                'user_id': user_id,
                'name': f"{user.get('firstName', '')} {user.get('lastName', '')}",
                'region': user.get('region', 'N/A'),
                
                # Targets
                'visit_target': targets.get('visits', 0),
                'order_target': targets.get('orders', 0),
                'revenue_target': targets.get('revenue', 0),
                
                # Achievements
                'visits_achieved': len(user_visits),
                'orders_achieved': len(user_orders),
                'revenue_achieved': user_orders['totalAmount'].sum() if not user_orders.empty and 'totalAmount' in user_orders.columns else 0,
            }
            
            # Calculate achievement percentages
            achievement['visit_achievement_pct'] = (achievement['visits_achieved'] / achievement['visit_target'] * 100) if achievement['visit_target'] > 0 else 0
            achievement['order_achievement_pct'] = (achievement['orders_achieved'] / achievement['order_target'] * 100) if achievement['order_target'] > 0 else 0
            achievement['revenue_achievement_pct'] = (achievement['revenue_achieved'] / achievement['revenue_target'] * 100) if achievement['revenue_target'] > 0 else 0
            
            achievements.append(achievement)
        
        return pd.DataFrame(achievements)


# Example usage
if __name__ == "__main__":
    db = AccordDatabase()
    analytics = SalesAnalytics(db)
    
    # Analyze last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    print("\n=== SALES PERFORMANCE SUMMARY ===")
    performance = analytics.get_sales_performance_summary(start_date, end_date)
    print(performance.to_string())
    
    print("\n=== CONVERSION FUNNEL ===")
    funnel = analytics.analyze_conversion_funnel(start_date, end_date)
    for key, value in funnel.items():
        print(f"{key}: {value}")
    
    print("\n=== REGIONAL PERFORMANCE ===")
    regional = analytics.analyze_regional_performance(start_date, end_date)
    print(regional.to_string())
    
    print("\n=== TOP PERFORMERS (by Revenue) ===")
    top_performers = analytics.identify_top_performers(start_date, end_date, metric='total_revenue', top_n=5)
    print(top_performers[['name', 'region', 'total_revenue', 'total_orders', 'conversion_rate']].to_string())
    
    db.close()
