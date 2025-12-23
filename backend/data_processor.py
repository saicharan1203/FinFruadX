import pandas as pd
import numpy as np
from io import StringIO
import json
import uuid

class DataProcessor:
    @staticmethod
    def validate_csv(file_content):
        """Validate and parse CSV file"""
        try:
            df = pd.read_csv(StringIO(file_content))
            return {
                'success': True,
                'rows': len(df),
                'columns': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
                'sample': df.head(3).to_dict(orient='records')
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def generate_sample_data(n_samples=1000, random_state=None):
        """Generate sample transaction data for testing"""
        if random_state is not None:
            np.random.seed(random_state)
        
        # Generate data as lists to avoid ndarray issues
        transaction_ids = [f"TXN-{uuid.uuid4().hex[:8].upper()}" for _ in range(n_samples)]
        customer_ids = np.random.randint(1000, 2000, n_samples).tolist()
        merchant_ids = np.random.randint(100, 500, n_samples).tolist()
        amounts = (np.random.exponential(50, n_samples) + 10).tolist()
        transaction_types = np.random.choice(['purchase', 'withdrawal', 'transfer'], n_samples).tolist()
        merchant_categories = np.random.choice(
            ['groceries', 'gas', 'restaurant', 'online', 'entertainment', 'travel'],
            n_samples
        ).tolist()
        timestamps = pd.date_range('2024-01-01', periods=n_samples, freq='h').tolist()
        locations = np.random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'], n_samples).tolist()
        
        data = {
            'transaction_id': transaction_ids,
            'customer_id': customer_ids,
            'merchant_id': merchant_ids,
            'amount': amounts,
            'transaction_type': transaction_types,
            'merchant_category': merchant_categories,
            'timestamp': timestamps,
            'location': locations
        }
        
        df = pd.DataFrame(data)
        
        # Add some fraud patterns
        fraud_indices = np.random.choice(n_samples, int(n_samples * 0.05), replace=False)
        fraud_amounts = np.random.uniform(1000, 5000, len(fraud_indices)).tolist()
        df.loc[fraud_indices, 'amount'] = fraud_amounts
        df.loc[fraud_indices, 'transaction_type'] = 'transfer'
        
        # Initialize is_fraud column
        df['is_fraud'] = [0] * n_samples
        df.loc[fraud_indices, 'is_fraud'] = 1
        
        return df
    
    @staticmethod
    def get_statistics(df):
        """Calculate statistics from results"""
        # Ensure required columns exist
        required_cols = ['is_fraud_predicted', 'is_anomaly', 'ensemble_fraud_probability', 'risk_level', 'merchant_category', 'confidence_score']
        for col in required_cols:
            if col not in df.columns:
                if col == 'is_fraud_predicted':
                    df[col] = 0
                elif col == 'is_anomaly':
                    df[col] = 0
                elif col == 'ensemble_fraud_probability':
                    df[col] = 0.0
                elif col == 'risk_level':
                    df[col] = 'Low'
                elif col == 'merchant_category':
                    df[col] = 'unknown'
                elif col == 'confidence_score':
                    df[col] = 0.0
        
        frauds = df['is_fraud_predicted'].sum()
        anomalies = df['is_anomaly'].sum()
        total = len(df)
        
        # Calculate additional statistics
        avg_confidence = float(df['confidence_score'].mean()) if 'confidence_score' in df.columns else 0.0
        high_confidence_frauds = int((df['confidence_score'] > 0.8).sum()) if 'confidence_score' in df.columns else 0
        
        # Risk distribution
        risk_distribution = df['risk_level'].value_counts().to_dict() if 'risk_level' in df.columns else {}
        
        # Category analysis
        category_fraud = {}
        if 'merchant_category' in df.columns and 'is_fraud_predicted' in df.columns:
            # Convert to ensure we're working with proper data types
            df_copy = df.copy()
            df_copy['is_fraud_predicted'] = pd.to_numeric(df_copy['is_fraud_predicted'], errors='coerce').fillna(0)
            category_stats = df_copy.groupby('merchant_category')['is_fraud_predicted'].agg(['count', 'sum']).reset_index()
            category_stats['fraud_rate'] = category_stats['sum'] / category_stats['count'] * 100
            category_fraud = category_stats.set_index('merchant_category')['fraud_rate'].to_dict()

        # Amount band analysis
        amount_band_stats = []
        if 'amount' in df.columns:
            df_amount = df.copy()
            df_amount['amount'] = pd.to_numeric(df_amount['amount'], errors='coerce').fillna(0)
            df_amount['is_fraud_predicted'] = pd.to_numeric(df_amount['is_fraud_predicted'], errors='coerce').fillna(0)

            bins = [-1, 500, 2000, 5000, 10000, float('inf')]
            labels = [
                'Micro (<₹500)',
                'Small (₹500-2k)',
                'Medium (₹2k-5k)',
                'Large (₹5k-10k)',
                'Ultra (₹10k+)' 
            ]
            df_amount['amount_band'] = pd.cut(df_amount['amount'], bins=bins, labels=labels)

            band_group = df_amount.groupby('amount_band')['is_fraud_predicted'].agg(['count', 'sum']).reset_index()
            band_group['fraud_rate'] = band_group.apply(
                lambda row: round((row['sum'] / row['count']) * 100, 2) if row['count'] > 0 else 0,
                axis=1
            )
            band_group.rename(columns={'count': 'transactions', 'sum': 'fraud_count'}, inplace=True)
            amount_band_stats = band_group.to_dict(orient='records')
        
        return {
            'total_transactions': int(total),
            'fraudulent_detected': int(frauds),
            'anomalies_detected': int(anomalies),
            'fraud_percentage': round(frauds / total * 100, 2) if total > 0 else 0,
            'avg_fraud_probability': float(df['ensemble_fraud_probability'].mean()),
            'max_fraud_probability': float(df['ensemble_fraud_probability'].max()),
            'high_risk_count': int((df['ensemble_fraud_probability'] > 0.7).sum()),
            'avg_confidence': round(avg_confidence * 100, 2),
            'high_confidence_frauds': high_confidence_frauds,
            'by_risk_level': risk_distribution,
            'by_category': df['merchant_category'].value_counts().head(5).to_dict() if 'merchant_category' in df.columns else {},
            'category_fraud_rates': category_fraud,
            'amount_band_stats': amount_band_stats
        }