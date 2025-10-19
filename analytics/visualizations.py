"""
Visualization Module
Create charts and visualizations for analytics reports
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import plotly.graph_objects as go
import plotly.express as px
from typing import Optional
import warnings
warnings.filterwarnings('ignore')

from database import AccordDatabase
from sales_analytics import SalesAnalytics

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

class Visualizations:
    """Create visualizations for analytics data"""
    
    def __init__(self, db: AccordDatabase):
        self.db = db
        self.analytics = SalesAnalytics(db)
    
    def plot_sales_performance_comparison(self, 
                                         start_date: datetime,
                                         end_date: datetime,
                                         save_path: Optional[str] = None):
        """
        Create bar chart comparing sales personnel performance
        """
        performance_df = self.analytics.get_sales_performance_summary(start_date, end_date)
        
        if performance_df.empty:
            print("No data to visualize")
            return
        
        # Sort by total revenue
        performance_df = performance_df.sort_values('total_revenue', ascending=False).head(15)
        
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # 1. Total Revenue
        axes[0, 0].barh(performance_df['name'], performance_df['total_revenue'], color='#2E86AB')
        axes[0, 0].set_xlabel('Total Revenue (KES)')
        axes[0, 0].set_title('Total Revenue by Sales Person')
        axes[0, 0].grid(axis='x', alpha=0.3)
        
        # 2. Total Visits
        axes[0, 1].barh(performance_df['name'], performance_df['total_visits'], color='#A23B72')
        axes[0, 1].set_xlabel('Number of Visits')
        axes[0, 1].set_title('Total Visits by Sales Person')
        axes[0, 1].grid(axis='x', alpha=0.3)
        
        # 3. Conversion Rate
        axes[1, 0].barh(performance_df['name'], performance_df['conversion_rate'], color='#F18F01')
        axes[1, 0].set_xlabel('Conversion Rate (%)')
        axes[1, 0].set_title('Conversion Rate by Sales Person')
        axes[1, 0].grid(axis='x', alpha=0.3)
        
        # 4. Success Rate
        axes[1, 1].barh(performance_df['name'], performance_df['success_rate'], color='#6A994E')
        axes[1, 1].set_xlabel('Success Rate (%)')
        axes[1, 1].set_title('Visit Success Rate by Sales Person')
        axes[1, 1].grid(axis='x', alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Chart saved to {save_path}")
        else:
            plt.show()
    
    def plot_regional_heatmap(self,
                             start_date: datetime,
                             end_date: datetime,
                             save_path: Optional[str] = None):
        """
        Create heatmap of regional performance
        """
        regional_df = self.analytics.analyze_regional_performance(start_date, end_date)
        
        if regional_df.empty:
            print("No data to visualize")
            return
        
        # Prepare data for heatmap
        metrics = ['total_visits', 'total_orders', 'total_revenue', 'success_rate', 'conversion_rate']
        heatmap_data = regional_df[['region'] + metrics].set_index('region')
        
        # Normalize data
        from sklearn.preprocessing import MinMaxScaler
        scaler = MinMaxScaler()
        heatmap_normalized = pd.DataFrame(
            scaler.fit_transform(heatmap_data),
            columns=heatmap_data.columns,
            index=heatmap_data.index
        )
        
        plt.figure(figsize=(12, 8))
        sns.heatmap(heatmap_normalized.T, annot=True, fmt='.2f', cmap='YlOrRd', 
                   cbar_kws={'label': 'Normalized Score'})
        plt.title('Regional Performance Heatmap (Normalized)', fontsize=14, fontweight='bold')
        plt.xlabel('Region')
        plt.ylabel('Metric')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Chart saved to {save_path}")
        else:
            plt.show()
    
    def plot_conversion_funnel(self,
                               start_date: datetime,
                               end_date: datetime,
                               save_path: Optional[str] = None):
        """
        Create conversion funnel visualization
        """
        funnel = self.analytics.analyze_conversion_funnel(start_date, end_date)
        
        if not funnel:
            print("No data to visualize")
            return
        
        # Create funnel chart using plotly
        stages = ['Total Visits', 'Successful Visits', 'Visits with Requests', 'Orders', 'Delivered Orders']
        values = [
            funnel['total_visits'],
            funnel['successful_visits'],
            funnel['visits_with_requests'],
            funnel['total_orders'],
            funnel['delivered_orders']
        ]
        
        fig = go.Figure(go.Funnel(
            y=stages,
            x=values,
            textposition="inside",
            textinfo="value+percent initial",
            marker={"color": ["#2E86AB", "#A23B72", "#F18F01", "#6A994E", "#C73E1D"]}
        ))
        
        fig.update_layout(
            title="Sales Conversion Funnel",
            height=600,
            font=dict(size=14)
        )
        
        if save_path:
            fig.write_html(save_path)
            print(f"Chart saved to {save_path}")
        else:
            fig.show()
    
    def plot_time_series_trends(self,
                               start_date: datetime,
                               end_date: datetime,
                               save_path: Optional[str] = None):
        """
        Plot time series trends for visits and orders
        """
        visits_df = self.db.get_visits(start_date, end_date)
        orders_df = self.db.get_orders(start_date, end_date)
        
        if visits_df.empty:
            print("No data to visualize")
            return
        
        # Aggregate by date
        visits_daily = visits_df.groupby(visits_df['date'].dt.date).size()
        orders_daily = orders_df.groupby(orders_df['createdAt'].dt.date).size() if not orders_df.empty else pd.Series()
        
        fig, axes = plt.subplots(2, 1, figsize=(14, 10))
        
        # Visits over time
        axes[0].plot(visits_daily.index, visits_daily.values, marker='o', linewidth=2, markersize=4, color='#2E86AB')
        axes[0].fill_between(visits_daily.index, visits_daily.values, alpha=0.3, color='#2E86AB')
        axes[0].set_xlabel('Date')
        axes[0].set_ylabel('Number of Visits')
        axes[0].set_title('Daily Visits Trend', fontsize=14, fontweight='bold')
        axes[0].grid(alpha=0.3)
        
        # Orders over time
        if not orders_daily.empty:
            axes[1].plot(orders_daily.index, orders_daily.values, marker='s', linewidth=2, markersize=4, color='#6A994E')
            axes[1].fill_between(orders_daily.index, orders_daily.values, alpha=0.3, color='#6A994E')
            axes[1].set_xlabel('Date')
            axes[1].set_ylabel('Number of Orders')
            axes[1].set_title('Daily Orders Trend', fontsize=14, fontweight='bold')
            axes[1].grid(alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Chart saved to {save_path}")
        else:
            plt.show()
    
    def plot_client_type_distribution(self,
                                     start_date: datetime,
                                     end_date: datetime,
                                     save_path: Optional[str] = None):
        """
        Create pie chart of client type distribution
        """
        client_analysis = self.analytics.analyze_client_types(start_date, end_date)
        
        if client_analysis.empty:
            print("No data to visualize")
            return
        
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        
        # Visits by client type
        colors = ['#2E86AB', '#A23B72', '#F18F01', '#6A994E', '#C73E1D', '#06A77D']
        axes[0].pie(client_analysis['total_visits'], labels=client_analysis['client_type'], 
                   autopct='%1.1f%%', colors=colors, startangle=90)
        axes[0].set_title('Visits by Client Type', fontsize=14, fontweight='bold')
        
        # Revenue potential by client type
        axes[1].pie(client_analysis['total_potential_value'], labels=client_analysis['client_type'],
                   autopct='%1.1f%%', colors=colors, startangle=90)
        axes[1].set_title('Revenue Potential by Client Type', fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Chart saved to {save_path}")
        else:
            plt.show()
    
    def create_dashboard_html(self,
                             start_date: datetime,
                             end_date: datetime,
                             save_path: str = 'dashboard.html'):
        """
        Create interactive HTML dashboard with multiple visualizations
        """
        performance_df = self.analytics.get_sales_performance_summary(start_date, end_date)
        regional_df = self.analytics.analyze_regional_performance(start_date, end_date)
        
        if performance_df.empty:
            print("No data to create dashboard")
            return
        
        # Create subplots
        from plotly.subplots import make_subplots
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Top Performers by Revenue', 'Regional Performance', 
                          'Conversion Rates', 'Visit Success Rates'),
            specs=[[{"type": "bar"}, {"type": "bar"}],
                   [{"type": "bar"}, {"type": "bar"}]]
        )
        
        # Top performers
        top_10 = performance_df.nlargest(10, 'total_revenue')
        fig.add_trace(
            go.Bar(x=top_10['name'], y=top_10['total_revenue'], name='Revenue',
                  marker_color='#2E86AB'),
            row=1, col=1
        )
        
        # Regional performance
        if not regional_df.empty:
            fig.add_trace(
                go.Bar(x=regional_df['region'], y=regional_df['total_revenue'], name='Revenue',
                      marker_color='#A23B72'),
                row=1, col=2
            )
        
        # Conversion rates
        fig.add_trace(
            go.Bar(x=top_10['name'], y=top_10['conversion_rate'], name='Conversion Rate',
                  marker_color='#F18F01'),
            row=2, col=1
        )
        
        # Success rates
        fig.add_trace(
            go.Bar(x=top_10['name'], y=top_10['success_rate'], name='Success Rate',
                  marker_color='#6A994E'),
            row=2, col=2
        )
        
        fig.update_layout(height=800, showlegend=False, title_text="ACCORD Medical Analytics Dashboard")
        fig.write_html(save_path)
        print(f"Dashboard saved to {save_path}")


# Example usage
if __name__ == "__main__":
    db = AccordDatabase()
    viz = Visualizations(db)
    
    # Set date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    print("Creating visualizations...")
    
    # Create various charts
    viz.plot_sales_performance_comparison(start_date, end_date, 'performance_comparison.png')
    viz.plot_regional_heatmap(start_date, end_date, 'regional_heatmap.png')
    viz.plot_conversion_funnel(start_date, end_date, 'conversion_funnel.html')
    viz.plot_time_series_trends(start_date, end_date, 'time_series_trends.png')
    viz.plot_client_type_distribution(start_date, end_date, 'client_distribution.png')
    viz.create_dashboard_html(start_date, end_date, 'dashboard.html')
    
    print("All visualizations created successfully!")
    
    db.close()
