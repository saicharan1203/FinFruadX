import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
import xgboost as xgb
import joblib
import os
from datetime import datetime

class FraudDetectionModel:
    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self.isolation_forest = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = None
        
    def prepare_features(self, df):
        """Engineer features from transaction data"""
        df = df.copy()
        
        # Basic validations
        required_cols = ['amount', 'merchant_category', 'transaction_type']
        for col in required_cols:
            if col not in df.columns:
                # Fill missing columns with defaults
                if col == 'amount':
                    df['amount'] = np.random.uniform(10, 500, len(df))
                elif col == 'merchant_category':
                    df['merchant_category'] = np.random.choice(
                        ['groceries', 'gas', 'restaurant', 'online', 'entertainment', 'travel'],
                        len(df)
                    )
                elif col == 'transaction_type':
                    df['transaction_type'] = np.random.choice(
                        ['purchase', 'withdrawal', 'transfer'],
                        len(df)
                    )
        
        # Time-based features
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            # Fix: Convert ndarray to Series before using fillna
            hour_fill_values = pd.Series(np.random.randint(0, 24, len(df)))
            df['hour'] = df['timestamp'].dt.hour.fillna(hour_fill_values)
            day_fill_values = pd.Series(np.random.randint(0, 7, len(df)))
            df['day_of_week'] = df['timestamp'].dt.dayofweek.fillna(day_fill_values)
            day_month_fill_values = pd.Series(np.random.randint(1, 32, len(df)))
            df['day_of_month'] = df['timestamp'].dt.day.fillna(day_month_fill_values)
        else:
            df['hour'] = np.random.randint(0, 24, len(df))
            df['day_of_week'] = np.random.randint(0, 7, len(df))
            df['day_of_month'] = np.random.randint(1, 32, len(df))
        
        # Amount-based features
        amount_series = pd.to_numeric(df['amount'], errors='coerce')
        df['amount'] = amount_series.fillna(50)
        df['amount_log'] = np.log1p(df['amount'])
        amount_std = df['amount'].std()
        if amount_std == 0:
            amount_std = 1
        df['amount_std'] = (df['amount'] - df['amount'].mean()) / amount_std
        
        # Categorical encoding
        categorical_cols = ['merchant_category', 'transaction_type']
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(
                    df[col].astype(str)
                )
            else:
                try:
                    df[f'{col}_encoded'] = self.label_encoders[col].transform(
                        df[col].astype(str)
                    )
                except:
                    df[f'{col}_encoded'] = 0
        
        # Statistical aggregations per merchant
        if 'merchant_id' in df.columns:
            merchant_id_series = pd.to_numeric(df['merchant_id'], errors='coerce')
            df['merchant_id'] = merchant_id_series.fillna(0)
            # Remove duplicate lines
            merchant_stats = df.groupby('merchant_id')['amount'].agg(
                ['mean', 'std', 'count']
            ).reset_index()
            merchant_stats.columns = ['merchant_id', 'merchant_avg_amount', 
                                      'merchant_std_amount', 'merchant_count']
            df = df.merge(merchant_stats, on='merchant_id', how='left')
            merchant_std = df['merchant_std_amount'].std()
            if pd.isna(merchant_std) or merchant_std == 0:
                merchant_std = 1
            df['amount_deviation'] = np.abs(
                (df['amount'] - df['merchant_avg_amount'].fillna(0)) / (df['merchant_std_amount'].fillna(1) + 1)
            )
        
        # Velocity features
        if 'customer_id' in df.columns:
            customer_id_series = pd.to_numeric(df['customer_id'], errors='coerce')
            df['customer_id'] = customer_id_series.fillna(0)
            customer_velocity = df.groupby('customer_id').size().reset_index(name='transaction_velocity')
            df = df.merge(customer_velocity, on='customer_id', how='left')
        
        return df
    
    def extract_feature_matrix(self, df):
        """Extract numeric features for modeling"""
        feature_cols = [
            'amount', 'amount_log', 'amount_std',
            'hour', 'day_of_week', 'day_of_month',
            'merchant_category_encoded', 'transaction_type_encoded'
        ]
        
        # Add optional columns if they exist
        optional_cols = ['merchant_avg_amount', 'merchant_std_amount', 
                        'merchant_count', 'amount_deviation', 'transaction_velocity']
        feature_cols.extend([col for col in optional_cols if col in df.columns])
        
        self.feature_names = feature_cols
        X = df[feature_cols].fillna(0)
        
        return X
    
    def train(self, df, fraud_label_col='is_fraud'):
        """Train fraud detection models"""
        print("Preparing features...")
        df_processed = self.prepare_features(df)
        
        print("Extracting features...")
        X = self.extract_feature_matrix(df_processed)
        
        if fraud_label_col in df_processed.columns:
            y = pd.to_numeric(df_processed[fraud_label_col], errors='coerce').fillna(0)
        else:
            y = np.zeros(len(df))
        
        print("Scaling features...")
        X_scaled = self.scaler.fit_transform(X)
        
        # Store training data statistics for later use
        self.training_stats = {
            'feature_count': X.shape[1],
            'sample_count': len(X),
            'fraud_ratio': float(y.mean()) if len(set(y)) > 1 else 0,
            'feature_names': list(X.columns) if hasattr(X, 'columns') else []
        }
        
        if len(set(y)) > 1:  # If we have both classes
            try:
                X_train, X_test, y_train, y_test = train_test_split(
                    X_scaled, y, test_size=0.2, random_state=42, stratify=y
                )
            except:
                X_train, X_test = X_scaled, X_scaled
                y_train, y_test = y, y
        else:
            X_train, X_test = X_scaled, X_scaled
            y_train, y_test = y, y
        
        print("Training Random Forest...")
        self.rf_model = RandomForestClassifier(
            n_estimators=50,   # Reduced for faster prediction (was 150)
            max_depth=10,      # Slightly reduced for speed
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.rf_model.fit(X_train, y_train)
        rf_score = self.rf_model.score(X_test, y_test) if len(set(y)) > 1 else 0
        print(f"   Random Forest Score: {rf_score:.4f}")
        
        print("Training XGBoost...")
        # Calculate base_score as the mean of target variable, clamped between 0.01 and 0.99
        base_score = max(0.01, min(0.99, float(y.mean()))) if len(set(y)) > 1 else 0.5
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=50,     # Reduced for faster prediction (was 150)
            max_depth=5,         # Reduced depth for speed
            learning_rate=0.15,  # Slightly higher to compensate
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss',
            base_score=base_score,
            verbose=0
        )
        self.xgb_model.fit(X_train, y_train)
        xgb_score = self.xgb_model.score(X_test, y_test) if len(set(y)) > 1 else 0
        print(f"   XGBoost Score: {xgb_score:.4f}")
        
        print("Training Isolation Forest (Anomaly Detection)...")
        self.isolation_forest = IsolationForest(
            contamination=max(0.05, min(0.3, float(y.mean()) * 2)) if len(set(y)) > 1 else 0.1,  # Adaptive contamination
            random_state=42,
            n_jobs=-1
        )
        self.isolation_forest.fit(X_scaled)
        
        # Calculate feature importances
        rf_importance = self.rf_model.feature_importances_ if self.rf_model else np.zeros(X.shape[1])
        xgb_importance = self.xgb_model.feature_importances_ if self.xgb_model else np.zeros(X.shape[1])
        
        # Combine importances
        combined_importance = (rf_importance + xgb_importance) / 2
        
        # Create feature importance dictionary
        feature_importance = {}
        feature_names = list(X.columns) if hasattr(X, 'columns') else [f'feature_{i}' for i in range(X.shape[1])]
        for i, name in enumerate(feature_names):
            feature_importance[name] = float(combined_importance[i])
        
        return {
            'rf_score': float(rf_score),
            'xgb_score': float(xgb_score),
            'samples_trained': len(X),
            'fraud_ratio': float(y.mean()) if len(set(y)) > 1 else 0,
            'feature_importance': feature_importance
        }
    
    def predict(self, df):
        """Predict fraud on new data"""
        # Check if models are trained
        if self.rf_model is None or self.xgb_model is None or self.isolation_forest is None:
            raise Exception("Models not trained yet. Please train the model first.")
        
        df_processed = self.prepare_features(df)
        X = self.extract_feature_matrix(df_processed)
        
        # Ensure X has the same columns as training data
        if self.feature_names is not None:
            # Add missing columns with default values
            for col in self.feature_names:
                if col not in X.columns:
                    X[col] = 0
            # Remove extra columns
            X = X[self.feature_names]
        
        X_scaled = self.scaler.transform(X)
        
        # Ensemble predictions with error handling
        try:
            rf_pred = self.rf_model.predict(X_scaled)
            # Handle case where predict_proba might return single column
            rf_proba_full = self.rf_model.predict_proba(X_scaled)
            if rf_proba_full.shape[1] > 1:
                rf_proba = rf_proba_full[:, 1]
            else:
                # If only one class was predicted during training, use the single column
                rf_proba = np.full(len(X_scaled), 0.5)  # Default to 0.5 probability
        except Exception as e:
            print(f"RF prediction error: {str(e)}")
            rf_pred = np.zeros(len(X_scaled))
            rf_proba = np.full(len(X_scaled), 0.5)
        
        try:
            xgb_pred = self.xgb_model.predict(X_scaled)
            # Handle case where predict_proba might return single column
            xgb_proba_full = self.xgb_model.predict_proba(X_scaled)
            if xgb_proba_full.shape[1] > 1:
                xgb_proba = xgb_proba_full[:, 1]
            else:
                # If only one class was predicted during training, use the single column
                xgb_proba = np.full(len(X_scaled), 0.5)  # Default to 0.5 probability
        except Exception as e:
            print(f"XGB prediction error: {str(e)}")
            xgb_pred = np.zeros(len(X_scaled))
            xgb_proba = np.full(len(X_scaled), 0.5)
        
        # Anomaly detection
        try:
            anomaly_pred = self.isolation_forest.predict(X_scaled)
            anomaly_score = -self.isolation_forest.score_samples(X_scaled)
        except Exception as e:
            print(f"Anomaly detection error: {str(e)}")
            anomaly_pred = np.ones(len(X_scaled))
            anomaly_score = np.zeros(len(X_scaled))

        # Ensemble voting with weighted average based on model performance
        ensemble_proba = (rf_proba + xgb_proba) / 2
        ensemble_pred = (ensemble_proba > 0.5).astype(int)
        iso_vote = (anomaly_pred == -1).astype(int)

        # Normalize anomaly score to 0-1 range for display
        if len(anomaly_score) > 0:
            iso_min = anomaly_score.min()
            iso_range = anomaly_score.max() - iso_min
            if iso_range == 0:
                iso_norm = np.zeros_like(anomaly_score)
            else:
                iso_norm = (anomaly_score - iso_min) / iso_range
        else:
            iso_norm = np.zeros_like(anomaly_score)

        results_df = df.copy()
        results_df['rf_fraud_probability'] = rf_proba
        results_df['xgb_fraud_probability'] = xgb_proba
        results_df['ensemble_fraud_probability'] = ensemble_proba
        results_df['is_fraud_predicted'] = ensemble_pred
        results_df['anomaly_score'] = anomaly_score
        results_df['is_anomaly'] = iso_vote
        results_df['iso_fraud_probability'] = iso_norm
        results_df['risk_level'] = results_df['ensemble_fraud_probability'].apply(
            lambda x: 'Critical' if x > 0.7 else ('High' if x > 0.5 else ('Medium' if x > 0.3 else 'Low'))
        )

        # Add confidence score
        results_df['confidence_score'] = np.abs(ensemble_proba - 0.5) * 2

        # Store per-model decision labels for frontend explainability
        results_df['rf_prediction'] = np.where(rf_pred == 1, 'Fraud', 'Normal')
        results_df['xgb_prediction'] = np.where(xgb_pred == 1, 'Fraud', 'Normal')
        results_df['iso_prediction'] = np.where(iso_vote == 1, 'Fraud', 'Normal')
        results_df['final_decision_label'] = np.where(ensemble_pred == 1, 'Fraud', 'Normal')

        agreement_state = []
        for rf_vote, xgb_vote, iso_result in zip(rf_pred, xgb_pred, iso_vote):
            unique_votes = len({int(rf_vote), int(xgb_vote), int(iso_result)})
            if unique_votes == 1:
                agreement_state.append('unanimous')
            elif unique_votes == 2:
                agreement_state.append('majority')
            else:
                agreement_state.append('split')

        results_df['agreement_state'] = agreement_state

        return results_df
    
    def save(self, path='models'):
        """Save trained models"""
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.rf_model, f'{path}/rf_model.pkl')
        joblib.dump(self.xgb_model, f'{path}/xgb_model.pkl')
        joblib.dump(self.isolation_forest, f'{path}/if_model.pkl')
        joblib.dump(self.scaler, f'{path}/scaler.pkl')
        joblib.dump(self.label_encoders, f'{path}/encoders.pkl')
        joblib.dump(self.feature_names, f'{path}/features.pkl')
        print(f"Models saved to {path}")
    
    def load(self, path='models'):
        """Load trained models"""
        try:
            self.rf_model = joblib.load(f'{path}/rf_model.pkl')
            self.xgb_model = joblib.load(f'{path}/xgb_model.pkl')
            self.isolation_forest = joblib.load(f'{path}/if_model.pkl')
            self.scaler = joblib.load(f'{path}/scaler.pkl')
            self.label_encoders = joblib.load(f'{path}/encoders.pkl')
            self.feature_names = joblib.load(f'{path}/features.pkl')
            print(f"Models loaded from {path}")
        except Exception as e:
            print(f"Could not load models: {str(e)}")