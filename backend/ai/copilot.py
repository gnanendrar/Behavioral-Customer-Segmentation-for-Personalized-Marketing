import os
import json
from typing import Dict, List, Any

try:
    import google.generativeai as genai
except ImportError:
    genai = None

class MarketingCopilot:
    """AI Marketing Copilot that answers marketing questions using actual analysis data."""
    
    def __init__(self, api_key: str = '') -> None:
        """Initialize the MarketingCopilot."""
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY', '')
        self.has_llm = bool(self.api_key and genai is not None)
        
        if self.has_llm:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')

    def answer(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Answer a marketing question based on the provided data context."""
        segments = context.get('segments', [])
        stats = context.get('overall_stats', {})
        alerts = context.get('alerts', [])
        
        if self.has_llm:
            return self._answer_with_llm(question, segments, stats, alerts)
        else:
            return self._answer_with_rules(question, segments, stats, alerts)
            
    def _build_prompt(self, question: str, segments: List[Dict[str, Any]], stats: Dict[str, Any], alerts: List[Dict[str, Any]]) -> str:
        """Build the system prompt containing analysis data."""
        total = stats.get('total_customers', 0)
        revenue = stats.get('total_revenue', 0.0)
        n_segments = len(segments)
        
        segment_details = ""
        for s in segments:
            name = s.get('name', 'Unknown')
            count = s.get('customer_count', 0)
            rev = s.get('revenue', 0.0)
            avg_val = s.get('avg_value', 0.0)
            churn = s.get('churn_risk', 'Unknown')
            chars = ", ".join(s.get('key_characteristics', []))
            segment_details += f"- {name}: {count} customers, ${rev:,.2f} revenue (Avg: ${avg_val:,.2f}), Churn Risk: {churn}. Characteristics: {chars}\n"
            
        alerts_text = "\n".join([f"- {a.get('message', '')}" for a in alerts]) if alerts else "None"
        
        prompt = f"""You are BehaviorIQ's Marketing Intelligence Assistant. You answer marketing questions based on real customer data analysis.

Here is the actual analysis data:

Total Customers: {total}
Total Revenue: ${revenue:,.2f}
Number of Segments: {n_segments}

Segment Details:
{segment_details}

Active Alerts:
{alerts_text}

Answer the user's question based ONLY on this data. Do not make up information. If the data doesn't contain enough information, say so. Be specific — reference segment names and numbers.
Return the result as a valid JSON object matching this schema:
{{
  "answer": "your detailed answer string",
  "data_references": ["list", "of", "referenced", "segments", "or", "metrics"],
  "confidence": "high|medium|low",
  "suggested_followups": ["3", "related", "follow-up", "questions"]
}}

User Question: {question}
"""
        return prompt

    def _answer_with_llm(self, question: str, segments: List[Dict[str, Any]], stats: Dict[str, Any], alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Use Gemini LLM to generate an answer."""
        prompt = self._build_prompt(question, segments, stats, alerts)
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            # Extract JSON from response text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].strip()
            
            result = json.loads(text)
            result['question'] = question
            return result
        except Exception as e:
            print(f"LLM generation failed: {e}. Falling back to rule-based engine.")
            return self._answer_with_rules(question, segments, stats, alerts)
            
    def _answer_with_rules(self, question: str, segments: List[Dict[str, Any]], stats: Dict[str, Any], alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Rule-based fallback for answering questions when LLM is unavailable."""
        question_lower = question.lower()
        answer = ""
        refs = []
        followups = []
        
        if 'churn' in question_lower or 'leaving' in question_lower:
            high_churn = [s for s in segments if str(s.get('churn_risk', '')).lower() in ['high', 'critical']]
            if high_churn:
                names = [s.get('name', 'Unknown') for s in high_churn]
                answer = f"The following segments have high churn risk: {', '.join(names)}. "
                answer += "Consider launching retention campaigns targeting these users immediately."
                refs.extend(names)
                followups = ["What is the total revenue at risk?", "How can we retain the high-churn segments?"]
            else:
                answer = "Currently, no segments are marked as high churn risk in the data."
                
        elif 'high value' in question_lower or 'best' in question_lower:
            if segments:
                best = sorted(segments, key=lambda x: x.get('avg_value', 0), reverse=True)[0]
                name = best.get('name', 'Unknown')
                avg_val = best.get('avg_value', 0.0)
                answer = f"Your highest value segment is '{name}' with an average customer value of ${avg_val:,.2f}."
                refs.append(name)
                followups = ["How can we find more customers like this?", "What products do these customers buy?"]
            else:
                answer = "There are no segments available to determine the best customers."
                
        elif 'revenue' in question_lower:
            if segments:
                breakdown = [f"{s.get('name', 'Unknown')}: ${s.get('revenue', 0.0):,.2f}" for s in segments]
                answer = "Revenue breakdown by segment:\n" + "\n".join(f"- {b}" for b in breakdown)
                refs.extend([s.get('name', 'Unknown') for s in segments])
                followups = ["Which segment is growing the fastest?", "How can we increase revenue in the lowest performing segment?"]
            else:
                answer = "No revenue data available by segment."
                
        elif 'campaign' in question_lower or 'target' in question_lower:
            if segments:
                # Target the largest segment
                largest = sorted(segments, key=lambda x: x.get('customer_count', 0), reverse=True)[0]
                name = largest.get('name', 'Unknown')
                answer = f"I recommend targeting the '{name}' segment as it represents your largest customer base, providing the highest potential reach for a broad campaign."
                refs.append(name)
                followups = ["What specific message should we use for this segment?", "Are there smaller, high-value segments to target instead?"]
            else:
                answer = "No segment data available to recommend a campaign target."
                
        else:
            # Default summary
            answer = f"You have {len(segments)} customer segments. Total revenue is ${stats.get('total_revenue', 0.0):,.2f} across {stats.get('total_customers', 0)} total customers."
            followups = ["Which segment has the highest churn risk?", "What is the revenue breakdown by segment?"]

        return {
            "question": question,
            "answer": answer,
            "data_references": refs,
            "confidence": "medium",
            "suggested_followups": followups
        }
