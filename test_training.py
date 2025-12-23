import sys
import os
import pandas as pd
import numpy as np

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from data_processor import DataProcessor
from ml_models import FraudDetectionModel

def test_model_training():
    """Test that model training works without errors"""
    print("Testing model training...")
    
    # Generate sample data
    df = DataProcessor.generate_sample_data(500)
    
    # Initialize the fraud detection model
    fraud_model = FraudDetectionModel()
    
    # Train the model
    try:
        training_stats = fraud_model.train(df, 'is_fraud')
        
        # Check that we have the expected keys in training stats
        expected_keys = ['rf_score', 'xgb_score', 'samples_trained', 'fraud_ratio', 'feature_importance']
        
        for key in expected_keys:
            assert key in training_stats, f"Missing key in training stats: {key}"
        
        print("Model training test passed!")
        print(f"   - Samples trained: {training_stats['samples_trained']}")
        print(f"   - Fraud ratio: {training_stats['fraud_ratio']:.3f}")
        print(f"   - Random Forest score: {training_stats['rf_score']:.3f}")
        print(f"   - XGBoost score: {training_stats['xgb_score']:.3f}")
        
        # Test prediction
        print("\nTesting model prediction...")
        predictions = fraud_model.predict(df.head(10))
        
        # Check that predictions have the expected columns
        expected_prediction_columns = ['is_fraud_predicted', 'is_anomaly', 'ensemble_fraud_probability', 
                                     'risk_level', 'confidence_score']
        
        for col in expected_prediction_columns:
            assert col in predictions.columns, f"Missing prediction column: {col}"
        
        print("Model prediction test passed!")
        print(f"   - Generated predictions for {len(predictions)} samples")
        print(f"   - Columns: {list(predictions.columns)}")
        
        return fraud_model, training_stats
        
    except Exception as e:
        print(f"Model training failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    try:
        # Test model training and prediction
        model, stats = test_model_training()
        
        print("\nAll training tests passed successfully!")
        
    except Exception as e:
        print(f"\nTraining test failed with error: {str(e)}")
        sys.exit(1)