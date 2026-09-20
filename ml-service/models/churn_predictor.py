import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import RandomForestClassifier

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "churn_rf_model.joblib")

FEATURE_NAMES = [
    "order_count",
    "ltv",
    "avg_order_value",
    "recency_days",
    "segment_code"  # 0: Standard, 1: Premium, 2: Enterprise
]

SEGMENT_MAP = {
    "standard": 0,
    "premium": 1,
    "enterprise": 2
}

def encode_segment(segment: str) -> int:
    if not segment or not isinstance(segment, str):
        return 0
    return SEGMENT_MAP.get(segment.strip().lower(), 0)

class ChurnPredictor:
    def __init__(self):
        self.model: RandomForestClassifier = None
        self.feature_importances: Dict[str, float] = {}
        self.train_score: float = 0.0
        self._ensure_model()

    def _ensure_model(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        if os.path.exists(MODEL_PATH):
            try:
                bundle = joblib.load(MODEL_PATH)
                self.model = bundle["model"]
                self.feature_importances = bundle.get("feature_importances", {})
                self.train_score = bundle.get("train_score", 0.94)
                return
            except Exception as e:
                print(f"[ChurnPredictor] Failed to load saved model: {e}. Retraining...")

        self.train_default_model()

    def _generate_synthetic_training_data(self, n_samples: int = 1200) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate realistic customer behavioral training dataset based on RFM principles:
        - High recency (long inactivity) + Low order count -> High churn probability (1)
        - Frequent buyer + High LTV + Low recency -> Loyal / Non-churn (0)
        """
        np.random.seed(42)

        # 1. Order Count (1 to 80)
        order_counts = np.random.exponential(scale=8, size=n_samples).astype(int) + 1
        order_counts = np.clip(order_counts, 1, 90)

        # 2. Average Order Value (₹20 to ₹800)
        avg_order_values = np.random.normal(loc=95, scale=40, size=n_samples)
        avg_order_values = np.clip(avg_order_values, 15, 600)

        # 3. LTV = order_count * avg_order_value with some variation
        ltv = order_counts * avg_order_values * np.random.uniform(0.9, 1.1, size=n_samples)

        # 4. Recency (days since last order: 1 to 180 days)
        recency_days = np.random.exponential(scale=35, size=n_samples).astype(int) + 1
        recency_days = np.clip(recency_days, 1, 180)

        # 5. Segment: 0=Standard, 1=Premium, 2=Enterprise
        segment_codes = np.random.choice([0, 1, 2], size=n_samples, p=[0.60, 0.25, 0.15])

        X = np.column_stack([
            order_counts,
            ltv,
            avg_order_values,
            recency_days,
            segment_codes
        ])

        # Churn Probability Score formula based on RFM
        # Higher recency = more churn
        # Lower orders = more churn
        # Enterprise customers churn less easily
        recency_score = np.clip((recency_days - 25) / 55.0, -1.0, 1.8)
        frequency_score = np.clip((4 - order_counts) / 3.0, -1.5, 1.5)
        spend_score = np.clip((150 - avg_order_values) / 100.0, -0.8, 1.0)
        segment_bonus = np.where(segment_codes == 2, -0.5, np.where(segment_codes == 1, -0.2, 0.1))

        logits = 0.7 * recency_score + 0.6 * frequency_score + 0.3 * spend_score + segment_bonus
        # Add slight natural randomness
        logits += np.random.normal(0, 0.35, size=n_samples)
        probabilities = 1.0 / (1.0 + np.exp(-logits))

        # Ground truth label: churned if prob >= 0.50
        y = (probabilities >= 0.50).astype(int)

        return X, y

    def train_default_model(self):
        """Train RandomForestClassifier and persist with joblib."""
        X, y = self._generate_synthetic_training_data(1500)

        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42
        )
        clf.fit(X, y)
        self.model = clf
        self.train_score = round(float(clf.score(X, y)), 4)

        # Extract feature importances
        self.feature_importances = {
            feat: round(float(imp), 4)
            for feat, imp in zip(FEATURE_NAMES, clf.feature_importances_)
        }

        # Save bundle
        bundle = {
            "model": self.model,
            "feature_importances": self.feature_importances,
            "train_score": self.train_score,
            "feature_names": FEATURE_NAMES
        }
        joblib.dump(bundle, MODEL_PATH)
        print(f"[ChurnPredictor] Model trained & saved to {MODEL_PATH} with accuracy: {self.train_score}")

    def _extract_feature_vector(self, data: Dict[str, Any]) -> np.ndarray:
        order_count = float(data.get("order_count") or data.get("orders") or 1)
        ltv = float(data.get("ltv") or 0.0)
        avg_order_value = float(data.get("avg_order_value") or (ltv / order_count if order_count > 0 else 50.0))
        recency_days = float(data.get("recency_days") or 30.0)
        segment = str(data.get("segment") or "Standard")
        segment_code = float(encode_segment(segment))

        return np.array([order_count, ltv, avg_order_value, recency_days, segment_code]).reshape(1, -1)

    def _compute_risk_factors(self, data: Dict[str, Any], prob: float) -> List[str]:
        factors = []
        recency = float(data.get("recency_days") or 30)
        orders = float(data.get("order_count") or data.get("orders") or 1)
        ltv = float(data.get("ltv") or 0)
        segment = str(data.get("segment") or "Standard")

        if recency > 45:
            factors.append(f"Inactivity gap: {int(recency)} days since last order")
        elif recency > 30:
            factors.append(f"Elevated dormancy ({int(recency)}d since activity)")

        if orders <= 2:
            factors.append(f"Low order frequency ({int(orders)} total orders)")

        if ltv < 200:
            factors.append(f"Sub-$200 total lifetime value")

        if segment.lower() == "standard" and prob >= 0.50:
            factors.append("Standard segment without loyalty tiering")

        if not factors:
            if prob < 0.35:
                factors.append("Consistent repeat order frequency and healthy recency")
            else:
                factors.append("Moderate engagement across RFM dimensions")

        return factors

    def predict_single(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            self._ensure_model()

        vec = self._extract_feature_vector(data)
        # Class 1 is churn probability
        churn_prob = float(self.model.predict_proba(vec)[0][1])
        churn_risk_percent = round(churn_prob * 100, 1)

        if churn_risk_percent >= 70:
            risk_tier = "High"
            action_recommendation = "Dispatch immediate VIP retention discount & personal account outreach"
        elif churn_risk_percent >= 40:
            risk_tier = "Moderate"
            action_recommendation = "Enroll in re-engagement email sequence & product recommendations"
        else:
            risk_tier = "Healthy"
            action_recommendation = "Maintain standard relationship; consider upselling premium tier"

        return {
            "churn_risk_percent": churn_risk_percent,
            "risk_tier": risk_tier,
            "prediction": int(churn_prob >= 0.50),
            "confidence": round(abs(churn_prob - 0.50) * 2, 2),
            "risk_factors": self._compute_risk_factors(data, churn_prob),
            "recommendation": action_recommendation,
            "model_type": "RandomForestClassifier",
            "features_used": {
                "order_count": float(vec[0][0]),
                "ltv": float(vec[0][1]),
                "avg_order_value": float(vec[0][2]),
                "recency_days": float(vec[0][3]),
                "segment_code": int(vec[0][4])
            }
        }

    def predict_batch(self, customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for c in customers:
            pred = self.predict_single(c)
            # Merge with customer identifier if provided
            res = {
                "id": c.get("id") or c.get("_id"),
                "name": c.get("name"),
                "email": c.get("email"),
                "segment": c.get("segment", "Standard"),
                "ltv": c.get("ltv", 0),
                "orders": c.get("order_count") or c.get("orders") or 1,
                **pred
            }
            results.append(res)
        return results

    def get_info(self) -> Dict[str, Any]:
        return {
            "model_type": "RandomForestClassifier",
            "n_estimators": 100,
            "max_depth": 6,
            "training_accuracy": self.train_score,
            "feature_names": FEATURE_NAMES,
            "feature_importances": self.feature_importances,
            "status": "active"
        }

# Global Singleton
churn_predictor = ChurnPredictor()
