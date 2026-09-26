// Segment profile
export interface SegmentProfile {
  segment_id: number;
  segment_name: string;
  customer_count: number;
  percentage: number;
  revenue_contribution: number;
  avg_value_score: number;
  avg_engagement_score: number;
  avg_loyalty_score: number;
  avg_churn_risk: number;
  avg_discount_sensitivity: number;
  avg_purchase_frequency: number;
  avg_order_value: number;
  avg_customer_lifetime_days: number;
  dominant_categories: string[];
  key_characteristics: string[];
  feature_means: Record<string, number>;
  feature_zscores: Record<string, number>;
  behavioral_summary: string;
}

// Customer scores
export interface CustomerScores {
  customer_id: string;
  engagement_score: number;
  loyalty_score: number;
  value_score: number;
  purchase_intent_score: number;
  discount_sensitivity_score: number;
  churn_risk_score: number;
  product_affinity_score: number;
  behavioral_customer_score: number;
}

// Customer 360 profile
export interface Customer360 {
  customer_id: string;
  segment_id: number;
  segment_name: string;
  scores: CustomerScores;
  features: Record<string, any>;
  dna: CustomerDNA;
  behavioral_changes: BehavioralChange[];
  score_explanations: Record<string, ScoreExplanation>;
}

// Customer DNA
export interface CustomerDNA {
  customer_id: string;
  bands: DNABand[];
  dna_hash: string;
  dominant_trait: string;
  weakest_trait: string;
  complexity_score: number;
}

export interface DNABand {
  key: string;
  label: string;
  color: string;
  value: number;
  intensity: string;
  width: number;
}

// Behavioral change
export interface BehavioralChange {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

// Score explanation
export interface ScoreExplanation {
  score_name: string;
  value: number;
  top_contributors: { feature: string; value: number; }[];
}

// Marketing action
export interface MarketingAction {
  segment_id: number;
  segment_name: string;
  strategy: string;
  channel: string[];
  offer: string;
  frequency: string;
  objective: string;
  priority: string;
  messaging_tone: string;
  rationale: string;
}

// Campaign
export interface Campaign {
  campaign_name: string;
  objective: string;
  target_audience: string;
  strategy: string;
  offer: string;
  channel: string[];
  subject_line: string;
  email_body: string;
  sms_copy: string;
  push_notification: string;
  call_to_action: string;
  recommended_timing: string;
  estimated_roi: { projected_response_rate: number; projected_revenue_uplift: number; };
  a_b_test_suggestions: string[];
}

// Simulation result
export interface SimulationResult {
  simulation_type: string;
  disclaimer: string;
  action: string;
  action_label: string;
  intensity: number;
  target_segment: string;
  customer_count: number;
  current_metrics: Record<string, number>;
  projected_changes: Record<string, { current: number; projected: number; change_pct: number; direction: string; }>;
  revenue_impact: { current_revenue: number; projected_revenue: number; revenue_change: number; revenue_change_pct: number; };
  confidence: number;
  confidence_label: string;
  time_horizon: string;
  risks: string[];
  recommendations: string[];
}

// Feature metadata
export interface FeatureMetadata {
  name: string;
  description: string;
  category: string;
  formula: string;
  min: number;
  max: number;
  mean: number;
  std: number;
}

// Alert
export interface Alert {
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  affected_count: number;
  segment_name: string | null;
  recommended_action: string;
  icon: string;
}

// Data quality
export interface DataQuality {
  total_rows: number;
  total_columns: number;
  missing_values: Record<string, number>;
  missing_percentage: Record<string, number>;
  duplicate_rows: number;
  data_types: Record<string, string>;
  numerical_columns: string[];
  categorical_columns: string[];
  date_columns: string[];
  outlier_counts: Record<string, number>;
  completeness_score: number;
}

// Micro segment
export interface MicroSegment {
  parent_segment_id: number;
  parent_segment_name: string;
  micro_segment_id: string;
  micro_segment_name: string;
  customer_count: number;
  percentage_of_parent: number;
  percentage_of_total: number;
  key_characteristics: string[];
  avg_scores: Record<string, number>;
}

// Revenue autopsy
export interface RevenueAutopsy {
  total_revenue: number;
  segment_contributions: { segment_id: number; segment_name: string; revenue: number; percentage: number; }[];
  narrative: string;
}

// Forecast
export interface RevenueForecast {
  disclaimer: string;
  horizon_days: number;
  total_current_revenue: number;
  total_projected_revenue: number;
  total_growth_pct: number;
  segment_forecasts: { segment_id: number; segment_name: string; projected_revenue: number; growth_rate_pct: number; growth_label: string; }[];
}

// Cohort
export interface Cohort {
  cohort_name: string;
  customer_count: number;
  avg_value_score: number;
  avg_engagement_score: number;
  avg_churn_risk: number;
  segment_distribution: Record<string, number>;
}

// Rescue queue item
export interface RescueQueueItem {
  customer_id: string;
  rescue_priority_score: number;
  value_score: number;
  churn_risk_score: number;
  revenue_at_risk: number;
  days_until_projected_churn: number;
  recommended_action: string;
  segment_name: string;
}

// Copilot response
export interface CopilotResponse {
  question: string;
  answer: string;
  data_references: string[];
  confidence: string;
  suggested_followups: string[];
}

// Model evaluation
export interface ModelEvaluation {
  algorithm: string;
  n_clusters: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  calinski_harabasz_score: number;
  feature_count: number;
  dataset_size: number;
}

// App status
export interface AppStatus {
  pipeline_status: string;
  has_data: boolean;
  has_analysis: boolean;
  uploaded_filename: string | null;
  total_customers: number;
  total_segments: number;
  error: string | null;
}

// Anomaly
export interface Anomaly {
  customer_id: string;
  segment_id: number;
  anomaly_type: string;
  severity: string;
  shift_direction: string;
  feature_name: string;
  feature_value: number;
  segment_mean: number;
  deviation_zscore: number;
  recommended_response: string;
}

// Golden hour
export interface GoldenHour {
  segment_id: number;
  segment_name: string;
  best_days: string[];
  best_hours: string;
  dead_zones: string;
  confidence: string;
}
