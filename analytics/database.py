"""
Database Connection Module
Connects to MongoDB and provides data extraction utilities
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Load environment variables
load_dotenv('../project/.env')

class AccordDatabase:
    """Handle MongoDB connections and data extraction for ACCORD Medical"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        self.mongo_uri = os.getenv('MONGODB_URI')
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client.get_database()
        
        print(f"✓ Connected to MongoDB: {self.db.name}")
    
    def get_users(self, role: Optional[str] = None) -> pd.DataFrame:
        """
        Get all users or filter by role
        
        Args:
            role: Filter by role (admin, manager, sales)
        
        Returns:
            DataFrame with user data
        """
        query = {}
        if role:
            query['role'] = role
        
        users = list(self.db.users.find(query))
        df = pd.DataFrame(users)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            if 'createdAt' in df.columns:
                df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        return df
    
    def get_visits(self, 
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None,
                   user_id: Optional[str] = None) -> pd.DataFrame:
        """
        Get visits with optional filters
        
        Args:
            start_date: Filter visits from this date
            end_date: Filter visits until this date
            user_id: Filter visits by specific user
        
        Returns:
            DataFrame with visit data
        """
        query = {}
        
        if start_date or end_date:
            query['date'] = {}
            if start_date:
                query['date']['$gte'] = start_date
            if end_date:
                query['date']['$lte'] = end_date
        
        if user_id:
            query['userId'] = user_id
        
        visits = list(self.db.visits.find(query))
        df = pd.DataFrame(visits)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df['userId'] = df['userId'].astype(str)
            df['date'] = pd.to_datetime(df['date'])
            if 'startTime' in df.columns:
                df['startTime'] = pd.to_datetime(df['startTime'])
            if 'endTime' in df.columns:
                df['endTime'] = pd.to_datetime(df['endTime'])
        
        return df
    
    def get_trails(self,
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None,
                   user_id: Optional[str] = None) -> pd.DataFrame:
        """
        Get GPS trails with optional filters
        
        Args:
            start_date: Filter trails from this date
            end_date: Filter trails until this date
            user_id: Filter trails by specific user
        
        Returns:
            DataFrame with trail data
        """
        query = {}
        
        if start_date or end_date:
            query['date'] = {}
            if start_date:
                query['date']['$gte'] = start_date
            if end_date:
                query['date']['$lte'] = end_date
        
        if user_id:
            query['userId'] = user_id
        
        trails = list(self.db.trails.find(query))
        df = pd.DataFrame(trails)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df['userId'] = df['userId'].astype(str)
            df['date'] = pd.to_datetime(df['date'])
        
        return df
    
    def get_orders(self,
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None,
                   status: Optional[str] = None) -> pd.DataFrame:
        """
        Get orders with optional filters
        
        Args:
            start_date: Filter orders from this date
            end_date: Filter orders until this date
            status: Filter by order status
        
        Returns:
            DataFrame with order data
        """
        query = {}
        
        if start_date or end_date:
            query['createdAt'] = {}
            if start_date:
                query['createdAt']['$gte'] = start_date
            if end_date:
                query['createdAt']['$lte'] = end_date
        
        if status:
            query['status'] = status
        
        orders = list(self.db.orders.find(query))
        df = pd.DataFrame(orders)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df['userId'] = df['userId'].astype(str)
            df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        return df
    
    def get_engineering_services(self,
                                 start_date: Optional[datetime] = None,
                                 end_date: Optional[datetime] = None) -> pd.DataFrame:
        """
        Get engineering services with optional filters
        
        Args:
            start_date: Filter services from this date
            end_date: Filter services until this date
        
        Returns:
            DataFrame with engineering service data
        """
        query = {}
        
        if start_date or end_date:
            query['date'] = {}
            if start_date:
                query['date']['$gte'] = start_date
            if end_date:
                query['date']['$lte'] = end_date
        
        services = list(self.db.engineeringservices.find(query))
        df = pd.DataFrame(services)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df['userId'] = df['userId'].astype(str)
            df['date'] = pd.to_datetime(df['date'])
        
        return df
    
    def get_quotations(self, status: Optional[str] = None) -> pd.DataFrame:
        """
        Get quotations with optional status filter
        
        Args:
            status: Filter by quotation status
        
        Returns:
            DataFrame with quotation data
        """
        query = {}
        if status:
            query['status'] = status
        
        quotations = list(self.db.quotations.find(query))
        df = pd.DataFrame(quotations)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df['requester'] = df['requester'].astype(str)
            df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        return df
    
    def get_communications(self, 
                          communication_type: Optional[str] = None) -> pd.DataFrame:
        """
        Get communications with optional type filter
        
        Args:
            communication_type: Filter by type (group, personal)
        
        Returns:
            DataFrame with communication data
        """
        query = {}
        if communication_type:
            query['type'] = communication_type
        
        communications = list(self.db.communications.find(query))
        df = pd.DataFrame(communications)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df['sender'] = df['sender'].astype(str)
            df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        return df
    
    def get_products(self, category: Optional[str] = None) -> pd.DataFrame:
        """
        Get products with optional category filter
        
        Args:
            category: Filter by product category
        
        Returns:
            DataFrame with product data
        """
        query = {}
        if category:
            query['category'] = category
        
        products = list(self.db.products.find(query))
        df = pd.DataFrame(products)
        
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
        
        return df
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()
        print("✓ MongoDB connection closed")

# Example usage
if __name__ == "__main__":
    # Initialize database connection
    db = AccordDatabase()
    
    # Get last 30 days of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Example: Get recent visits
    visits_df = db.get_visits(start_date=start_date, end_date=end_date)
    print(f"\nVisits in last 30 days: {len(visits_df)}")
    
    # Example: Get all sales personnel
    sales_users = db.get_users(role='sales')
    print(f"Total sales personnel: {len(sales_users)}")
    
    # Close connection
    db.close()
