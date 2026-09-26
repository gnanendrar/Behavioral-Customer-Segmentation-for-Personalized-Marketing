import os
import json
from typing import Dict, Any

try:
    import google.generativeai as genai
except ImportError:
    genai = None

class CampaignGenerator:
    """Campaign content generator."""
    
    def __init__(self, api_key: str = '') -> None:
        """Initialize the CampaignGenerator."""
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY', '')
        self.has_llm = bool(self.api_key and genai is not None)
        
        if self.has_llm:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_campaign(self, segment_profile: Dict[str, Any], marketing_action: Dict[str, Any], custom_instructions: str = '') -> Dict[str, Any]:
        """Generate a complete marketing campaign based on segment profile and action."""
        if self.has_llm:
            return self._generate_with_llm(segment_profile, marketing_action, custom_instructions)
        else:
            return self._generate_with_templates(segment_profile, marketing_action)

    def _generate_with_llm(self, segment_profile: Dict[str, Any], marketing_action: Dict[str, Any], custom_instructions: str) -> Dict[str, Any]:
        """Use Gemini LLM to generate campaign content."""
        prompt = f"""You are an expert marketing copywriter and campaign strategist.
Create a detailed, highly effective marketing campaign for the following customer segment.

Segment Profile:
{json.dumps(segment_profile, indent=2)}

Recommended Marketing Action:
{json.dumps(marketing_action, indent=2)}

Custom Instructions: {custom_instructions if custom_instructions else 'None'}

Return the campaign as a JSON object matching this exact schema:
{{
  "campaign_name": "catchy internal name",
  "objective": "clear goal",
  "target_audience": "description based on segment",
  "strategy": "overall approach",
  "offer": "the specific incentive or value proposition",
  "channel": ["email", "sms", "push"],
  "subject_line": "compelling email subject line",
  "email_body": "Full HTML-ish email copy (150-200 words). Professional and persuasive.",
  "sms_copy": "Punchy SMS text (max 160 chars).",
  "push_notification": "Short push alert (50-80 chars).",
  "call_to_action": "The exact CTA text",
  "recommended_timing": "When to send (e.g., Tuesday 10AM)",
  "estimated_roi": {{
    "projected_response_rate": "percentage string like '5-8%'",
    "projected_revenue_uplift": "currency or percentage estimate"
  }},
  "a_b_test_suggestions": ["test A", "test B"]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"LLM campaign generation failed: {e}. Falling back to templates.")
            return self._generate_with_templates(segment_profile, marketing_action)

    def _generate_with_templates(self, segment_profile: Dict[str, Any], marketing_action: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback for campaign generation when LLM is unavailable."""
        action_type = marketing_action.get('type', 'retention').lower()
        segment_name = segment_profile.get('name', 'Valued Customers')
        customer_count = segment_profile.get('customer_count', 1000)
        
        # Base template structure
        campaign = {
            "target_audience": f"Customers in the '{segment_name}' segment.",
            "channel": ["email", "sms", "push"],
            "recommended_timing": "Tuesday or Thursday at 10:00 AM local time",
            "estimated_roi": {
                "projected_response_rate": "3-5%",
                "projected_revenue_uplift": f"${int(customer_count * 0.05 * 50):,}" # Rough estimate assuming 5% conversion and $50 AOV
            }
        }
        
        if 'retention' in action_type or 'churn' in action_type:
            campaign.update({
                "campaign_name": f"{segment_name} Re-engagement Campaign",
                "objective": "Prevent churn and re-engage at-risk customers.",
                "strategy": "Offer a significant, time-sensitive incentive to bring them back.",
                "offer": "20% off next purchase valid for 48 hours.",
                "subject_line": "We miss you! Here's 20% off your next order.",
                "email_body": f"Hi there,<br><br>It's been a while since we last saw you, and we've missed you! To welcome you back, we're offering an exclusive 20% discount on your next purchase.<br><br>We've added a lot of great new products we think you'll love. Don't wait—this special offer is only valid for the next 48 hours.<br><br>Best regards,<br>The Team",
                "sms_copy": "We miss you! Come back today and get 20% off your next order. Shop now: [LINK]. Valid for 48h.",
                "push_notification": "We've missed you! Claim your 20% discount today.",
                "call_to_action": "Claim My 20% Off",
                "a_b_test_suggestions": ["Test 20% off vs. $10 flat discount", "Test 'We miss you' vs. 'Exclusive offer for you' subject lines"]
            })
        elif 'loyalty' in action_type or 'premium' in action_type:
            campaign.update({
                "campaign_name": f"{segment_name} VIP Appreciation",
                "objective": "Reward loyalty and encourage continued high engagement.",
                "strategy": "Provide exclusive access or premium rewards.",
                "offer": "Early access to new collection + free premium shipping.",
                "subject_line": "Exclusive VIP Access: Shop Our New Collection First",
                "email_body": f"Hello,<br><br>As one of our most valued customers, we want to give you exclusive early access to our newest collection before anyone else.<br><br>Enjoy browsing the latest arrivals, and as a special thank you for your continued loyalty, enjoy free premium shipping on all orders placed this week.<br><br>Thank you for being the best part of our community.<br><br>Warmly,<br>The Team",
                "sms_copy": "VIP Exclusive: Shop our new collection before anyone else! Plus, enjoy free premium shipping this week. [LINK]",
                "push_notification": "VIP Access Unlocked: Shop new arrivals early!",
                "call_to_action": "Shop Early Access",
                "a_b_test_suggestions": ["Test early access vs. exclusive gift with purchase", "Test sending on weekend vs. weekday"]
            })
        elif 'reactivation' in action_type or 'dormant' in action_type:
            campaign.update({
                "campaign_name": f"{segment_name} Win-Back Campaign",
                "objective": "Reactivate dormant accounts.",
                "strategy": "Highlight what's new and offer a compelling reason to return.",
                "offer": "$15 off any purchase over $50.",
                "subject_line": "See what you've been missing (+$15 inside)",
                "email_body": f"Hi there,<br><br>A lot has changed since you last visited us! We've launched new features, expanded our selection, and improved our service.<br><br>We'd love for you to come back and see what's new. To make it easier, here is $15 off any order over $50.<br><br>Take a look around and see why thousands of customers are loving our latest updates.<br><br>Cheers,<br>The Team",
                "sms_copy": "Come back and see what's new! Enjoy $15 off your next order over $50. Shop now: [LINK]",
                "push_notification": "Ready to return? Here's $15 off your next order.",
                "call_to_action": "Redeem My $15",
                "a_b_test_suggestions": ["Test highlighting new products vs. focusing only on the discount", "Test 7-day vs. 14-day expiry"]
            })
        elif 'cross-sell' in action_type or 'engaged' in action_type:
            campaign.update({
                "campaign_name": f"{segment_name} Product Discovery",
                "objective": "Increase AOV and product category adoption.",
                "strategy": "Recommend complementary products based on previous engagement.",
                "offer": "Bundle discount: Buy X, get Y at 30% off.",
                "subject_line": "We thought you might like these...",
                "email_body": f"Hello,<br><br>Based on what you've loved in the past, we've hand-picked a few items we think would be the perfect match.<br><br>Even better, if you bundle them today, you can enjoy 30% off the complementary items. It's the perfect way to upgrade your experience and discover something new.<br><br>Explore your personalized recommendations today.<br><br>Best,<br>The Team",
                "sms_copy": "Upgrade your experience! Get 30% off complementary items when you bundle today. Shop your recommendations: [LINK]",
                "push_notification": "Perfect matches found! Enjoy 30% off bundles.",
                "call_to_action": "View Recommendations",
                "a_b_test_suggestions": ["Test bundle discount vs. free sample of cross-sell item", "Test subject line personalization (using first name)"]
            })
        elif 'welcome' in action_type or 'new' in action_type:
            campaign.update({
                "campaign_name": f"{segment_name} Welcome Series",
                "objective": "Onboard new customers and drive first repeat purchase.",
                "strategy": "Introduce the brand story and offer a first-time buyer incentive.",
                "offer": "15% off first order.",
                "subject_line": "Welcome to the Family! Here is 15% off",
                "email_body": f"Welcome,<br><br>We are thrilled to have you here! Our goal is to provide you with the best products and service possible.<br><br>To get you started on the right foot, please enjoy 15% off your very first order with us. Use code WELCOME15 at checkout.<br><br>If you have any questions, our support team is always here to help.<br><br>Best,<br>The Team",
                "sms_copy": "Welcome! We're so glad you're here. Use code WELCOME15 for 15% off your first order. Shop now: [LINK]",
                "push_notification": "Welcome aboard! Claim your 15% welcome gift.",
                "call_to_action": "Shop with 15% Off",
                "a_b_test_suggestions": ["Test 15% off vs. Free Shipping", "Test plain text vs. highly visual email design"]
            })
        elif 'discount' in action_type or 'promotion' in action_type:
            campaign.update({
                "campaign_name": f"{segment_name} Flash Sale",
                "objective": "Drive immediate conversions from price-sensitive customers.",
                "strategy": "Create urgency with a limited-time flash sale.",
                "offer": "Up to 50% off select items for 24 hours.",
                "subject_line": "Flash Sale: Up to 50% Off Ends Tomorrow!",
                "email_body": f"Hi,<br><br>It's time to treat yourself! For the next 24 hours, we're offering up to 50% off on our most popular items.<br><br>This is our biggest sale of the season, and stock is moving fast. Don't miss out on these incredible savings.<br><br>Click below to shop the sale before it's gone.<br><br>Best,<br>The Team",
                "sms_copy": "FLASH SALE! Up to 50% off select items for 24h only. Shop the deals before they're gone: [LINK]",
                "push_notification": "Flash Sale! Up to 50% off ends in 24 hours.",
                "call_to_action": "Shop the Sale",
                "a_b_test_suggestions": ["Test 'Up to 50% off' vs. 'Clearance prices'", "Test 24h vs. 48h urgency"]
            })
        else:
            # Default / General Newsletter
            campaign.update({
                "campaign_name": f"{segment_name} Monthly Update",
                "objective": "Maintain engagement and brand awareness.",
                "strategy": "Share valuable content and a soft promotional offer.",
                "offer": "10% off storewide.",
                "subject_line": "Your Monthly Update + A Special Gift",
                "email_body": f"Hi,<br><br>Here's your monthly roundup of news, tips, and updates from our team. We've been working hard to bring you the best experience possible.<br><br>As a token of our appreciation for being part of our community, please enjoy 10% off your next purchase using code THANKYOU10.<br><br>Stay tuned for more exciting news next month!<br><br>Best,<br>The Team",
                "sms_copy": "Check out our latest updates! Plus, use code THANKYOU10 for 10% off your next order. Shop: [LINK]",
                "push_notification": "Monthly update is here! Open for a special discount.",
                "call_to_action": "Shop Now",
                "a_b_test_suggestions": ["Test content-heavy vs. promotion-heavy email layout", "Test different CTA button colors"]
            })
            
        return campaign
