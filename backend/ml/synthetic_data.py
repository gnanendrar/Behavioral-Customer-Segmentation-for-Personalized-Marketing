import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_dataset(n_customers: int = 1500, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic customer dataset based on 8 behavioral archetypes.
    """
    np.random.seed(seed)
    random.seed(seed)
    
    # Archetypes proportions
    archetypes = [
        "High-Value Loyalists", "Emerging High-Potential", "Promotion-Driven Buyers",
        "Engaged Low-Spenders", "At-Risk Loyal", "New & Curious", "Dormant", "Frequent Low-Value"
    ]
    probs = [0.08, 0.10, 0.15, 0.12, 0.10, 0.15, 0.18, 0.12]
    
    # Generate base categories
    categories = ['Electronics', 'Fashion', 'Home & Garden', 'Books', 'Sports', 'Beauty', 'Food', 'Toys']
    regions = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'WA', 'AZ', 'MA', 'CO', 'NJ']
    referral_sources = ['organic', 'google_ads', 'social_media', 'referral', 'email', 'direct']
    preferred_channels = ['email', 'sms', 'push', 'app']
    
    data = []
    
    base_date = pd.Timestamp("2026-09-01")
    
    for i in range(n_customers):
        arch = np.random.choice(archetypes, p=probs)
        
        # Base attributes
        if arch == "High-Value Loyalists":
            order_count = int(np.random.normal(50, 15))
            total_spending = np.random.normal(15000, 3000)
            tenure_days = np.random.randint(1000, 2000)
            recency_days = np.random.randint(1, 15)
            session_factor = 2.0
            coupon_prob = 0.2
        elif arch == "Emerging High-Potential":
            order_count = int(np.random.normal(20, 8))
            total_spending = np.random.normal(5000, 1500)
            tenure_days = np.random.randint(300, 800)
            recency_days = np.random.randint(1, 30)
            session_factor = 1.5
            coupon_prob = 0.3
        elif arch == "Promotion-Driven Buyers":
            order_count = int(np.random.normal(15, 5))
            total_spending = np.random.normal(2000, 800)
            tenure_days = np.random.randint(500, 1500)
            recency_days = np.random.randint(10, 60)
            session_factor = 1.2
            coupon_prob = 0.9
        elif arch == "Engaged Low-Spenders":
            order_count = int(np.random.normal(10, 4))
            total_spending = np.random.normal(500, 200)
            tenure_days = np.random.randint(200, 1000)
            recency_days = np.random.randint(5, 25)
            session_factor = 3.0
            coupon_prob = 0.4
        elif arch == "At-Risk Loyal":
            order_count = int(np.random.normal(40, 10))
            total_spending = np.random.normal(10000, 2000)
            tenure_days = np.random.randint(1000, 2000)
            recency_days = np.random.randint(90, 180)
            session_factor = 0.5
            coupon_prob = 0.3
        elif arch == "New & Curious":
            order_count = int(np.random.normal(2, 1))
            total_spending = np.random.normal(300, 150)
            tenure_days = np.random.randint(5, 60)
            recency_days = np.random.randint(1, 20)
            session_factor = 1.5
            coupon_prob = 0.5
        elif arch == "Dormant":
            order_count = int(np.random.normal(5, 3))
            total_spending = np.random.normal(800, 400)
            tenure_days = np.random.randint(500, 2000)
            recency_days = np.random.randint(180, 500)
            session_factor = 0.1
            coupon_prob = 0.1
        else: # "Frequent Low-Value"
            order_count = int(np.random.normal(80, 20))
            total_spending = np.random.normal(3000, 800)
            tenure_days = np.random.randint(500, 1500)
            recency_days = np.random.randint(1, 20)
            session_factor = 1.0
            coupon_prob = 0.8
            
        # Ensure minimums and clip boundaries
        order_count = max(0, min(200, order_count))
        if arch == "New & Curious":
            order_count = max(1, min(3, order_count))
            
        total_spending = max(0, min(25000, total_spending))
        if order_count == 0:
            total_spending = 0
            
        first_purchase_date = base_date - pd.Timedelta(days=tenure_days)
        last_purchase_date = base_date - pd.Timedelta(days=recency_days)
        
        if last_purchase_date < first_purchase_date:
            last_purchase_date = first_purchase_date
            
        signup_date = first_purchase_date - pd.Timedelta(days=np.random.randint(0, 30))
        
        avg_order_value = total_spending / order_count if order_count > 0 else 0.0
        
        website_visits = int(max(0, min(1000, order_count * session_factor * np.random.uniform(1, 5))))
        app_sessions = int(max(0, min(500, order_count * session_factor * np.random.uniform(0, 3))))
        session_count = website_visits + app_sessions
        
        email_opens = int(max(0, min(200, order_count * np.random.uniform(1, 4))))
        email_clicks = int(max(0, min(100, min(email_opens, email_opens * np.random.uniform(0.1, 0.6)))))
        
        ad_interactions = int(max(0, min(100, order_count * np.random.uniform(0, 2))))
        
        coupon_usage = int(max(0, min(50, order_count * coupon_prob * np.random.uniform(0.5, 1.0))))
        discount_usage = int(max(0, min(50, coupon_usage * np.random.uniform(0.8, 1.2))))
        
        cart_additions = order_count + int(np.random.exponential(5 * session_factor))
        cart_abandonment = max(0, min(50, cart_additions - order_count))
        
        product_usage_frequency = float(max(0, min(50, np.random.uniform(0, 50))))
        customer_support_interactions = int(max(0, min(20, np.random.exponential(1))))
        
        customer_lifetime_value = total_spending * np.random.uniform(1.0, 1.5)
        
        sub_status = np.random.choice(['active', 'inactive', 'none'], p=[0.2, 0.1, 0.7])
        sub_duration = int(np.random.uniform(1, 60)) if sub_status != 'none' else 0
        
        returns_refunds = int(max(0, min(20, order_count * np.random.uniform(0, 0.15))))
        
        has_ratings = np.random.random() > 0.3
        product_ratings = float(np.clip(np.random.normal(4.2, 0.6), 1.0, 5.0)) if has_ratings else 0.0
        review_count = int(max(0, min(30, order_count * np.random.uniform(0, 0.3)))) if has_ratings else 0
        
        last_email_date = base_date - pd.Timedelta(days=np.random.randint(1, 90))
        
        row = {
            'customer_id': f'CUST-{i:05d}',
            'first_purchase_date': first_purchase_date.date(),
            'last_purchase_date': last_purchase_date.date(),
            'order_count': order_count,
            'total_spending': round(total_spending, 2),
            'avg_order_value': round(avg_order_value, 2),
            'product_category': np.random.choice(categories),
            'website_visits': website_visits,
            'app_sessions': app_sessions,
            'session_count': session_count,
            'email_opens': email_opens,
            'email_clicks': email_clicks,
            'ad_interactions': ad_interactions,
            'coupon_usage': coupon_usage,
            'discount_usage': discount_usage,
            'cart_additions': cart_additions,
            'cart_abandonment': cart_abandonment,
            'product_usage_frequency': round(product_usage_frequency, 2),
            'customer_support_interactions': customer_support_interactions,
            'customer_lifetime_value': round(customer_lifetime_value, 2),
            'subscription_status': sub_status,
            'subscription_duration_months': sub_duration,
            'returns_refunds': returns_refunds,
            'product_ratings': round(product_ratings, 2),
            'review_count': review_count,
            'signup_date': signup_date.date(),
            'region': np.random.choice(regions),
            'referral_source': np.random.choice(referral_sources),
            'last_email_date': last_email_date.date(),
            'preferred_channel': np.random.choice(preferred_channels)
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Introduce ~3% missing values randomly in some columns
    cols_for_na = ['product_ratings', 'region', 'preferred_channel', 'referral_source']
    for col in cols_for_na:
        mask = np.random.random(len(df)) < 0.03
        df.loc[mask, col] = np.nan
        
    return df

def save_synthetic_dataset(path: str = './data/synthetic_customers.csv', n_customers: int = 1500) -> str:
    """
    Generates and saves the synthetic dataset to the given path.
    """
    abs_path = os.path.abspath(path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    df = generate_synthetic_dataset(n_customers=n_customers)
    df.to_csv(abs_path, index=False)
    return abs_path
