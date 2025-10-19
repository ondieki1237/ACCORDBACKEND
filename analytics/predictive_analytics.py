"""
Predictive Analytics Module
Machine learning models for forecasting and predictions
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Tuple, List
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, classification_report
import warnings
warnings.filterwarnings('ignore')

from database import AccordDatabase

class PredictiveAnalytics:
    """Machine learning models for predictions and forecasting"""
    
    def __init__(self, db: AccordDatabase):
        self.db = db
    
    def predict_revenue_forecast(self, months_ahead: int = 3) -> pd.DataFrame:
        """
        Forecast revenue for upcoming months based on historical data
        
        Args:
            months_ahead: Number of months to forecast
        
        Returns:
            DataFrame with revenue forecasts
        """
        # Get historical orders
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)  # 1 year of data
        
        orders_df = self.db.get_orders(start_date, end_date)
        
        if orders_df.empty or len(orders_df) < 10:
            print("Insufficient historical data for forecasting")
            return pd.DataFrame()
        
        # Aggregate by month
        orders_df['month'] = orders_df['createdAt'].dt.to_period('M')
        monthly_revenue = orders_df.groupby('month')['totalAmount'].sum().reset_index()
        monthly_revenue['month_num'] = range(len(monthly_revenue))
        
        # Simple linear regression for forecasting
        X = monthly_revenue['month_num'].values.reshape(-1, 1)
        y = monthly_revenue['totalAmount'].values
        
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict future months
        last_month_num = monthly_revenue['month_num'].max()
        future_months = np.array(range(last_month_num + 1, last_month_num + 1 + months_ahead)).reshape(-1, 1)
        predictions = model.predict(future_months)
        
        # Create forecast dataframe
        last_period = monthly_revenue['month'].iloc[-1]
        forecast_periods = pd.period_range(start=last_period + 1, periods=months_ahead, freq='M')
        
        forecast_df = pd.DataFrame({
            'month': forecast_periods.astype(str),
            'predicted_revenue': predictions,
            'confidence': 'medium'  # Simple confidence indicator
        })
        
        return forecast_df
    
    def predict_visit_success(self, visits_df: pd.DataFrame = None) -> Tuple[object, pd.DataFrame]:
        """
        Train a model to predict visit success likelihood
        
        Args:
            visits_df: Optional pre-loaded visits dataframe
        
        Returns:
            Tuple of (trained model, feature importance dataframe)
        """
        if visits_df is None:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=180)
            visits_df = self.db.get_visits(start_date, end_date)
        
        if visits_df.empty or len(visits_df) < 50:
            print("Insufficient data for training")
            return None, pd.DataFrame()
        
        # Prepare features
        features = []
        labels = []
        
        for _, visit in visits_df.iterrows():
            if 'visitOutcome' not in visit or pd.isna(visit['visitOutcome']):
                continue
            
            client = visit.get('client', {})
            
            feature = {
                'client_type': client.get('type', 'unknown') if isinstance(client, dict) else 'unknown',
                'visit_purpose': visit.get('visitPurpose', 'other'),
                'num_contacts': len(visit.get('contacts', [])) if isinstance(visit.get('contacts'), list) else 0,
                'has_existing_equipment': len(visit.get('existingEquipment', [])) > 0 if isinstance(visit.get('existingEquipment'), list) else 0,
                'num_requested_equipment': len(visit.get('requestedEquipment', [])) if isinstance(visit.get('requestedEquipment'), list) else 0,
                'duration': visit.get('duration', 0) if pd.notna(visit.get('duration')) else 0,
                'hour_of_day': pd.to_datetime(visit['startTime']).hour if pd.notna(visit.get('startTime')) else 12,
                'day_of_week': pd.to_datetime(visit['date']).dayofweek if pd.notna(visit.get('date')) else 0,
            }
            
            features.append(feature)
            labels.append(1 if visit['visitOutcome'] == 'successful' else 0)
        
        if not features:
            print("No valid features extracted")
            return None, pd.DataFrame()
        
        feature_df = pd.DataFrame(features)
        
        # Encode categorical variables
        label_encoders = {}
        for col in ['client_type', 'visit_purpose']:
            le = LabelEncoder()
            feature_df[col] = le.fit_transform(feature_df[col])
            label_encoders[col] = le
        
        # Train model
        X = feature_df.values
        y = np.array(labels)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = (y_pred == y_test).mean()
        
        print(f"\nVisit Success Prediction Model Accuracy: {accuracy:.2%}")
        
        # Feature importance
        importance_df = pd.DataFrame({
            'feature': feature_df.columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return model, importance_df
    
    def identify_high_value_opportunities(self, threshold_percentile: int = 75) -> pd.DataFrame:
        """
        Identify high-value sales opportunities from recent visits
        
        Args:
            threshold_percentile: Percentile threshold for "high value"
        
        Returns:
            DataFrame with high-value opportunities
        """
        # Get recent visits with requests
        end_date = datetime.now()
        start_date = end_date - timedelta(days=60)
        
        visits_df = self.db.get_visits(start_date, end_date)
        
        if visits_df.empty:
            return pd.DataFrame()
        
        # Filter visits with requested equipment
        opportunities = []
        
        for _, visit in visits_df.iterrows():
            requested = visit.get('requestedEquipment', [])
            if not isinstance(requested, list) or len(requested) == 0:
                continue
            
            potential_value = visit.get('totalPotentialValue', 0)
            
            if potential_value > 0:
                client = visit.get('client', {})
                
                opportunity = {
                    'visit_id': str(visit['_id']),
                    'date': visit['date'],
                    'client_name': client.get('name', 'Unknown') if isinstance(client, dict) else 'Unknown',
                    'client_type': client.get('type', 'unknown') if isinstance(client, dict) else 'unknown',
                    'client_location': client.get('location', 'Unknown') if isinstance(client, dict) else 'Unknown',
                    'potential_value': potential_value,
                    'num_items_requested': len(requested),
                    'visit_outcome': visit.get('visitOutcome', 'unknown'),
                    'follow_up_required': visit.get('isFollowUpRequired', False),
                }
                
                opportunities.append(opportunity)
        
        if not opportunities:
            return pd.DataFrame()
        
        opp_df = pd.DataFrame(opportunities)
        
        # Calculate threshold
        threshold = opp_df['potential_value'].quantile(threshold_percentile / 100)
        
        # Filter high-value opportunities
        high_value = opp_df[opp_df['potential_value'] >= threshold].sort_values('potential_value', ascending=False)
        
        return high_value
    
    def predict_churn_risk(self) -> pd.DataFrame:
        """
        Identify clients at risk of churning (no recent visits)
        
        Returns:
            DataFrame with clients and their churn risk
        """
        # Get all historical visits
        visits_df = self.db.get_visits()
        
        if visits_df.empty:
            return pd.DataFrame()
        
        # Group by client
        client_visits = []
        
        for _, visit in visits_df.iterrows():
            client = visit.get('client', {})
            if isinstance(client, dict):
                client_visits.append({
                    'client_name': client.get('name', 'Unknown'),
                    'client_type': client.get('type', 'unknown'),
                    'visit_date': visit['date']
                })
        
        if not client_visits:
            return pd.DataFrame()
        
        client_df = pd.DataFrame(client_visits)
        
        # Find last visit date for each client
        last_visits = client_df.groupby('client_name').agg({
            'visit_date': 'max',
            'client_type': 'first'
        }).reset_index()
        
        # Calculate days since last visit
        now = pd.Timestamp.now()
        last_visits['days_since_visit'] = (now - last_visits['visit_date']).dt.days
        
        # Risk scoring
        def calculate_risk(days):
            if days < 30:
                return 'Low'
            elif days < 60:
                return 'Medium'
            elif days < 90:
                return 'High'
            else:
                return 'Critical'
        
        last_visits['churn_risk'] = last_visits['days_since_visit'].apply(calculate_risk)
        
        # Sort by risk
        risk_order = {'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1}
        last_visits['risk_score'] = last_visits['churn_risk'].map(risk_order)
        last_visits = last_visits.sort_values('risk_score', ascending=False)
        
        return last_visits[last_visits['churn_risk'].isin(['High', 'Critical'])]
    
    def recommend_next_best_actions(self, user_id: str) -> List[Dict]:
        """
        Recommend next best actions for a sales person based on their history
        
        Args:
            user_id: User ID to generate recommendations for
        
        Returns:
            List of recommended actions
        """
        # Get user's visit history
        visits_df = self.db.get_visits(user_id=user_id)
        
        if visits_df.empty:
            return []
        
        recommendations = []
        
        # 1. Follow up on high-value opportunities
        high_value_visits = visits_df[
            (visits_df['totalPotentialValue'] > visits_df['totalPotentialValue'].quantile(0.7)) &
            (visits_df['visitOutcome'] == 'successful')
        ].sort_values('totalPotentialValue', ascending=False).head(5)
        
        for _, visit in high_value_visits.iterrows():
            client = visit.get('client', {})
            recommendations.append({
                'action': 'Follow up on high-value opportunity',
                'priority': 'High',
                'client': client.get('name', 'Unknown') if isinstance(client, dict) else 'Unknown',
                'potential_value': visit.get('totalPotentialValue', 0),
                'days_since_visit': (datetime.now() - pd.to_datetime(visit['date'])).days
            })
        
        # 2. Revisit clients with pending follow-ups
        pending_followups = visits_df[visits_df['isFollowUpRequired'] == True]
        
        for _, visit in pending_followups.head(5).iterrows():
            client = visit.get('client', {})
            recommendations.append({
                'action': 'Complete pending follow-up',
                'priority': 'Medium',
                'client': client.get('name', 'Unknown') if isinstance(client, dict) else 'Unknown',
                'days_since_visit': (datetime.now() - pd.to_datetime(visit['date'])).days
            })
        
        # 3. Re-engage with clients not visited recently
        client_last_visits = visits_df.groupby(
            visits_df['client'].apply(lambda x: x.get('name', 'Unknown') if isinstance(x, dict) else 'Unknown')
        )['date'].max()
        
        old_clients = client_last_visits[
            (datetime.now() - client_last_visits).dt.days > 45
        ].sort_values(ascending=False).head(5)
        
        for client, last_visit in old_clients.items():
            recommendations.append({
                'action': 'Re-engage inactive client',
                'priority': 'Low',
                'client': client,
                'days_since_visit': (datetime.now() - last_visit).days
            })
        
        return recommendations


# Example usage
if __name__ == "__main__":
    db = AccordDatabase()
    predictive = PredictiveAnalytics(db)
    
    print("\n=== REVENUE FORECAST ===")
    forecast = predictive.predict_revenue_forecast(months_ahead=3)
    print(forecast.to_string())
    
    print("\n=== HIGH-VALUE OPPORTUNITIES ===")
    opportunities = predictive.identify_high_value_opportunities()
    if not opportunities.empty:
        print(opportunities.to_string())
    
    print("\n=== CHURN RISK ANALYSIS ===")
    churn_risk = predictive.predict_churn_risk()
    if not churn_risk.empty:
        print(churn_risk.head(10).to_string())
    
    print("\n=== VISIT SUCCESS PREDICTION MODEL ===")
    model, importance = predictive.predict_visit_success()
    if not importance.empty:
        print("\nFeature Importance:")
        print(importance.to_string())
    
    db.close()
