<?php

namespace Database\Seeders;

use App\Models\AdminSetting;
use Illuminate\Database\Seeder;

class AdminSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'id_verification_expires_after_years',
                'value' => '1',
                'description' => 'Number of years before ID verification expires (1 or 2 years)',
                'type' => 'integer',
                'category' => 'verification',
            ],
            [
                'key' => 'id_verification_grace_period_days',
                'value' => '30',
                'description' => 'Number of days after expiration before creator status is disabled',
                'type' => 'integer',
                'category' => 'verification',
            ],
            [
                'key' => 'id_verification_provider',
                'value' => 'sumsub',
                'description' => 'Default ID verification provider',
                'type' => 'string',
                'category' => 'verification',
            ],
            // Site branding
            [
                'key' => 'site_name',
                'value' => config('app.name'),
                'description' => 'Public site name shown in headers and metadata',
                'type' => 'string',
                'category' => 'branding',
            ],
            [
                'key' => 'site_logo_url',
                'value' => '',
                'description' => 'Primary logo URL (1x)',
                'type' => 'string',
                'category' => 'branding',
            ],
            [
                'key' => 'site_logo_2x_url',
                'value' => '',
                'description' => 'Primary logo URL (2x)',
                'type' => 'string',
                'category' => 'branding',
            ],
            [
                'key' => 'site_logo_dark_url',
                'value' => '',
                'description' => 'Dark mode logo URL (1x)',
                'type' => 'string',
                'category' => 'branding',
            ],
            [
                'key' => 'site_logo_dark_2x_url',
                'value' => '',
                'description' => 'Dark mode logo URL (2x)',
                'type' => 'string',
                'category' => 'branding',
            ],
            // Communication & Support
            [
                'key' => 'support_email',
                'value' => '',
                'description' => 'Support contact email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'legal_email',
                'value' => '',
                'description' => 'Legal contact email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'press_email',
                'value' => '',
                'description' => 'Press / media inquiries email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'abuse_email',
                'value' => '',
                'description' => 'Abuse reports email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'outbound_from_name',
                'value' => '',
                'description' => 'Display name for outbound emails',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'outbound_from_email',
                'value' => '',
                'description' => 'From address for outbound emails',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'contact_url',
                'value' => '',
                'description' => 'Contact form or support portal URL',
                'type' => 'string',
                'category' => 'communication',
            ],
            // Feature flags
            [
                'key' => 'feature_ads_enabled',
                'value' => '1',
                'description' => 'Enable house and network ad placements across the site.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_radar_enabled',
                'value' => '1',
                'description' => 'Enable Radar (location-driven discovery and proximity).',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_signals_enabled',
                'value' => '1',
                'description' => 'Enable Signals (creator tools / monetization).',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_wishlist_enabled',
                'value' => '1',
                'description' => 'Enable Wishlist (creator wishlist feature).',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'wishlist_requires_approval',
                'value' => '0',
                'description' => 'Require admin approval for new wishlist items.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'wishlist_platform_fee_percent',
                'value' => '10.0',
                'description' => 'Platform fee percentage for wishlist purchases (default 10%).',
                'type' => 'float',
                'category' => 'features',
            ],
            [
                'key' => 'feature_video_chat_enabled',
                'value' => '0',
                'description' => 'Enable real-time video sessions and live rooms.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_messaging_enabled',
                'value' => '1',
                'description' => 'Enable direct messages and group conversations.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_events_enabled',
                'value' => '1',
                'description' => 'Enable events (creation, RSVPs, calendar).',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_bookmarks_enabled',
                'value' => '1',
                'description' => 'Enable bookmarks.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_beta_enabled',
                'value' => '0',
                'description' => 'Enable opt-in beta features.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            // Compliance & Legal
            [
                'key' => 'cookie_policy_content',
                'value' => <<<'HTML'
<h1>Cookie Policy</h1>
<p>We use cookies to keep the site reliable, measure performance, and improve your experience.</p>
<h2>Categories</h2>
<ul>
  <li>Necessary</li>
  <li>Analytics</li>
  <li>Marketing</li>
</ul>
<p>Manage your preferences from the cookie banner or footer link.</p>
HTML,
                'description' => 'Cookie Policy content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            // Announcements & Maintenance
            [
                'key' => 'global_announcement_enabled',
                'value' => '0',
                'description' => 'Show global announcement banner',
                'type' => 'boolean',
                'category' => 'announcements',
            ],
            [
                'key' => 'global_announcement_level',
                'value' => 'info',
                'description' => 'Announcement level: info|warn|urgent',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'global_announcement_message',
                'value' => '',
                'description' => 'Announcement message markdown/text',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'global_announcement_dismissible',
                'value' => '1',
                'description' => 'Users can dismiss announcement',
                'type' => 'boolean',
                'category' => 'announcements',
            ],
            [
                'key' => 'global_announcement_start_at',
                'value' => '',
                'description' => 'Announcement start ISO datetime',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'global_announcement_end_at',
                'value' => '',
                'description' => 'Announcement end ISO datetime',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'maintenance_banner_enabled',
                'value' => '0',
                'description' => 'Show maintenance banner',
                'type' => 'boolean',
                'category' => 'announcements',
            ],
            [
                'key' => 'maintenance_banner_message',
                'value' => '',
                'description' => 'Maintenance message',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'maintenance_banner_cta_label',
                'value' => 'Learn more',
                'description' => 'Maintenance CTA label',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'maintenance_banner_cta_url',
                'value' => '',
                'description' => 'Maintenance CTA url',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'emergency_interstitial_enabled',
                'value' => '0',
                'description' => 'Show emergency interstitial',
                'type' => 'boolean',
                'category' => 'announcements',
            ],
            [
                'key' => 'emergency_interstitial_message',
                'value' => '',
                'description' => 'Emergency interstitial text',
                'type' => 'string',
                'category' => 'announcements',
            ],
            [
                'key' => 'dmca_policy_content',
                'value' => <<<'HTML'
<h1>Digital Millennium Copyright Act (DMCA) Policy</h1>
<p><strong>Last Updated:</strong> {{last_updated}}</p>
<p>This DMCA Policy outlines the procedures for reporting copyright infringement on {{site_name}} and our process for responding to such claims. We respect the intellectual property rights of others and expect our users to do the same. We will respond to valid notices of alleged copyright infringement that comply with applicable law and are properly provided to us.</p>

<h2>Copyright Infringement Notification</h2>
<p>If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible on our platform, you may notify our designated copyright agent by providing the following information in writing. Please be aware that to be effective, your notification must be a written communication that includes substantially the following:</p>

<h3>Required Information for DMCA Notice</h3>
<ul>
  <li>A physical or electronic signature of the copyright owner or a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
  <li>Identification of the copyrighted work claimed to have been infringed, or if multiple copyrighted works at a single online site are covered by a single notification, a representative list of such works.</li>
  <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, including information reasonably sufficient to permit us to locate the material (e.g., specific URLs on our platform).</li>
  <li>Information reasonably sufficient to permit us to contact you, such as your full legal name, mailing address, telephone number, and email address.</li>
  <li>A statement that you have a good-faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
  <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
  </ul>

<h3>Submission of DMCA Notice</h3>
<p>All DMCA notices should be sent to our designated copyright agent below. We may publish or share information from your notice, such as the identity of the rights holder and the nature of the claim, with the user who posted the allegedly infringing content or publicly. Upon receipt of a valid DMCA notice, we will expeditiously remove or disable access to the allegedly infringing material and notify the user who posted the content. We reserve the right to terminate the accounts of users who are repeat infringers.</p>

<h2>Counter-Notification Procedure</h2>
<p>If you believe that your content was removed or disabled by mistake or misidentification, you may file a counter-notification with our designated copyright agent. To be effective, your counter-notification must be a written communication that includes substantially all of the following:</p>

<h3>Required Information for Counter-Notice</h3>
<ul>
  <li>Your physical or electronic signature.</li>
  <li>Identification of the material that has been removed or to which access has been disabled, and the location at which the material appeared before it was removed or access to it was disabled (e.g., specific URLs).</li>
  <li>A statement under penalty of perjury that you have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
  <li>Your full legal name, mailing address, telephone number, and email address.</li>
  <li>A statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located, or if your address is outside of the United States, for any judicial district in which we may be found, and that you will accept service of process from the person who provided the original DMCA notification or an agent of such person.</li>
</ul>
<p>Upon receipt of a valid counter-notification, we will forward it to the party who submitted the original DMCA notice. If we do not receive notice within ten business days that the original complainant has filed a court action to prevent further infringement of the material, we may replace or restore access to the material that was removed.</p>

<h2>Repeat Infringer Policy</h2>
<p>We maintain a policy of terminating, in appropriate circumstances, the accounts of users who are repeat infringers of copyright. We consider a repeat infringer to be any user who has been the subject of more than one valid takedown notice that has not been successfully countered. We also reserve the right to terminate accounts of users who, in our sole judgment, are deemed to be repeat infringers even if they have not been the subject of multiple formal DMCA notices.</p>

<h2>Misrepresentations</h2>
<p>Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing, or that material or activity was removed or disabled by mistake or misidentification, may be subject to liability.</p>

<h2>Content Creator Protections</h2>
<p>Creators retain all rights to their original content. We will work to ensure that legitimate content is not unfairly removed and that creators have the opportunity to submit counter-notifications when appropriate.</p>

<h2>Limitations and Disclaimer</h2>
<p>We act as a neutral intermediary in processing DMCA notices and counter-notifications. Our removal or restoration of content should not be construed as an admission regarding infringement. We make no representations or warranties regarding the accuracy of any DMCA notice or counter-notification we receive.</p>

<h2>Changes to This Policy</h2>
<p>We reserve the right to modify this DMCA Policy at any time. Changes will be effective immediately upon posting.</p>

<h2>Contact Information</h2>
<p>Designated DMCA Agent</p>
<p>
  <strong>{{site_name}}</strong><br />
  Email: {{dmca_email}}<br />
  Legal: {{legal_email}} · Support: {{support_email}} · Abuse: {{abuse_email}}
</p>
HTML,
                'description' => 'DMCA Policy content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'age_of_consent_text',
                'value' => 'You must be 18 or older to use this site.',
                'description' => 'Age of consent statement used in age gate and footers',
                'type' => 'string',
                'category' => 'legal',
            ],
            // Cookies & GDPR
            [
                'key' => 'cookie_banner_enabled',
                'value' => '1',
                'description' => 'Enable cookie consent banner for visitors',
                'type' => 'boolean',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookie_banner_message',
                'value' => 'We use cookies to personalize content, enhance your experience, and analyze our traffic.',
                'description' => 'Cookie banner message',
                'type' => 'string',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookie_banner_cta_label',
                'value' => 'Accept all',
                'description' => 'Primary CTA label shown on cookie banner',
                'type' => 'string',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookie_banner_policy_url',
                'value' => '/legal/privacy',
                'description' => 'Link to cookie or privacy policy',
                'type' => 'string',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookie_allow_analytics',
                'value' => '0',
                'description' => 'Default analytics consent',
                'type' => 'boolean',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookie_allow_marketing',
                'value' => '0',
                'description' => 'Default marketing consent',
                'type' => 'boolean',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookies_services',
                'value' => json_encode([
                    ['name' => 'Google Analytics', 'url' => 'https://policies.google.com/privacy'],
                    ['name' => 'Stripe', 'url' => 'https://stripe.com/legal/privacy-center'],
                ]),
                'description' => 'Third party services that set cookies (name + url)',
                'type' => 'json',
                'category' => 'cookies',
            ],
            [
                'key' => 'do_not_sell_default',
                'value' => '0',
                'description' => 'Default state for do-not-sell/share toggle',
                'type' => 'boolean',
                'category' => 'cookies',
            ],
            [
                'key' => 'consent_reprompt_days',
                'value' => '180',
                'description' => 'Days until re-prompt for consent',
                'type' => 'integer',
                'category' => 'cookies',
            ],
            [
                'key' => 'terms_content',
                'value' => <<<'HTML'
<h1>Terms of Service</h1>
<p>Welcome to Real Kink Men. By accessing or using our services, you agree to these Terms.</p>
<h2>Acceptable Use</h2>
<ul>
  <li>Consent-first interactions.</li>
  <li>No illegal content or activity.</li>
  <li>Respect identities, boundaries, and local laws.</li>
  <li>Follow moderator instructions when given.</li>
</ul>
HTML,
                'description' => 'Terms of Service content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'privacy_content',
                'value' => <<<'HTML'
<h1>Privacy Policy</h1>
<p>Your privacy matters. This policy explains what data we collect and how we use it.</p>
<h2>Data We Collect</h2>
<ul>
  <li>Account & profile data you provide.</li>
  <li>Device and usage analytics.</li>
  <li>Consent preferences for cookies.</li>
</ul>
<h2>How We Use Data</h2>
<p>To keep the site reliable and secure, personalize your experience, and improve our services.</p>
HTML,
                'description' => 'Privacy Policy content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'guidelines_content',
                'value' => <<<'HTML'
<h1>Community Guidelines</h1>
<p>We’re a consent-first community. Respect boundaries, identities, and consent choreography.</p>
<ul>
  <li>No harassment or hate speech.</li>
  <li>No doxxing, threats, or non-consensual content.</li>
  <li>Use content warnings where relevant.</li>
</ul>
HTML,
                'description' => 'Community Guidelines content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
        ];

        foreach ($settings as $setting) {
            AdminSetting::query()->updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
