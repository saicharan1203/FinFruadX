import sys
import os
import pandas as pd
import numpy as np

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from data_processor import DataProcessor

def test_sample_data_generation():
    """Test that sample data generation works without errors"""
    print("Testing sample data generation...")
    
    # Generate sample data
    df = DataProcessor.generate_sample_data(100)
    
    # Check that we have the expected columns
    expected_columns = ['customer_id', 'merchant_id', 'amount', 'transaction_type', 
                       'merchant_category', 'timestamp', 'location', 'is_fraud']
    
    for col in expected_columns:
        assert col in df.columns, f"Missing column: {col}"
    
    # Check that we have the right number of rows
    assert len(df) == 100, f"Expected 100 rows, got {len(df)}"
    
    # Check that is_fraud column has binary values
    unique_fraud_values = df['is_fraud'].unique()
    assert set(unique_fraud_values).issubset({0, 1}), f"is_fraud should only contain 0 and 1, got {unique_fraud_values}"
    
    # Check that we have some fraud cases (approximately 5%)
    fraud_count = df['is_fraud'].sum()
    assert fraud_count > 0, "Should have some fraud cases"
    
    print("Sample data generation test passed!")
    print(f"   - Generated {len(df)} rows")
    print(f"   - Found {fraud_count} fraud cases ({fraud_count/len(df)*100:.1f}%)")
    print(f"   - Columns: {list(df.columns)}")
    
    return df

def test_statistics_calculation(df):
    """Test that statistics calculation works"""
    print("\nTesting statistics calculation...")
    
    # Add required columns for statistics calculation
    df['is_fraud_predicted'] = df['is_fraud']  # Use actual fraud as predicted for test
    df['is_anomaly'] = np.random.choice([0, 1], len(df), p=[0.9, 0.1])
    df['ensemble_fraud_probability'] = np.random.uniform(0, 1, len(df))
    df['risk_level'] = np.random.choice(['Low', 'Medium', 'High', 'Critical'], len(df))
    df['confidence_score'] = np.random.uniform(0, 1, len(df))
    
    # Calculate statistics
    stats = DataProcessor.get_statistics(df)
    
    # Check that we have the expected keys
    expected_keys = ['total_transactions', 'fraudulent_detected', 'anomalies_detected', 
                     'fraud_percentage', 'avg_fraud_probability', 'max_fraud_probability',
                     'high_risk_count', 'avg_confidence', 'high_confidence_frauds',
                     'by_risk_level', 'by_category', 'category_fraud_rates']
    
    for key in expected_keys:
        assert key in stats, f"Missing key in statistics: {key}"
    
    print("Statistics calculation test passed!")
    print(f"   - Total transactions: {stats['total_transactions']}")
    print(f"   - Fraud detected: {stats['fraudulent_detected']}")
    print(f"   - Fraud percentage: {stats['fraud_percentage']}%")
    
    return stats

if __name__ == "__main__":
    try:
        # Test sample data generation
        df = test_sample_data_generation()
        
        # Test statistics calculation
        stats = test_statistics_calculation(df)
        
        print("\nAll tests passed successfully!")
        
    except Exception as e:
        print(f"\nTest failed with error: {str(e)}")
        import traceback
        traceback.print_exc()