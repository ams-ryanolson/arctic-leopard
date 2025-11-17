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
            // Branding
            [
                'key' => 'site_logo_2x_url',
                'value' => '',
                'description' => 'Primary logo URL (2x)',
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
            [
                'key' => 'site_logo_dark_url',
                'value' => '',
                'description' => 'Dark mode logo URL (1x)',
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
                'key' => 'site_name',
                'value' => 'Real Kink Men',
                'description' => 'Public site name shown in headers and metadata',
                'type' => 'string',
                'category' => 'branding',
            ],

            // Communication
            [
                'key' => 'abuse_email',
                'value' => 'abuse@realkink.men',
                'description' => 'Abuse reports email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'contact_url',
                'value' => 'https://www.realkink.men/contact',
                'description' => 'Contact form or support portal URL',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'legal_email',
                'value' => 'legal@realkink.men',
                'description' => 'Legal contact email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'outbound_from_email',
                'value' => 'hello@realkink.men',
                'description' => 'From address for outbound emails',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'outbound_from_name',
                'value' => 'Hello from Real Kink Men',
                'description' => 'Display name for outbound emails',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'press_email',
                'value' => 'press@realkink.men',
                'description' => 'Press / media inquiries email',
                'type' => 'string',
                'category' => 'communication',
            ],
            [
                'key' => 'support_email',
                'value' => 'support@realkink.men',
                'description' => 'Support contact email',
                'type' => 'string',
                'category' => 'communication',
            ],

            // Cookies
            [
                'key' => 'consent_reprompt_days',
                'value' => '180',
                'description' => 'Days until re-prompt for consent',
                'type' => 'integer',
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
                'key' => 'cookie_banner_cta_label',
                'value' => 'Accept all',
                'description' => 'Primary CTA label shown on cookie banner',
                'type' => 'string',
                'category' => 'cookies',
            ],
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
                'key' => 'cookie_banner_policy_url',
                'value' => '/legal/privacy',
                'description' => 'Link to cookie or privacy policy',
                'type' => 'string',
                'category' => 'cookies',
            ],
            [
                'key' => 'cookies_services',
                'value' => '[{"name":"Google Analytics","url":"https:\\/\\/policies.google.com\\/privacy"},{"name":"Stripe","url":"https:\\/\\/stripe.com\\/legal\\/privacy-center"}]',
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

            // Features
            [
                'key' => 'feature_ads_enabled',
                'value' => '1',
                'description' => 'Enable house and network ad placements across the site.',
                'type' => 'boolean',
                'category' => 'features',
            ],
            [
                'key' => 'feature_beta_enabled',
                'value' => '1',
                'description' => 'Enable opt-in beta features.',
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
                'key' => 'feature_events_enabled',
                'value' => '1',
                'description' => 'Enable events (creation, RSVPs, calendar).',
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
                'key' => 'feature_video_chat_enabled',
                'value' => '1',
                'description' => 'Enable real-time video sessions and live rooms.',
                'type' => 'boolean',
                'category' => 'features',
            ],

            // General
            [
                'key' => 'emergency_interstitial_enabled',
                'value' => '0',
                'description' => null,
                'type' => 'boolean',
                'category' => 'general',
            ],
            [
                'key' => 'emergency_interstitial_message',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'feature_stories_enabled',
                'value' => '1',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'global_announcement_dismissible',
                'value' => '1',
                'description' => null,
                'type' => 'boolean',
                'category' => 'general',
            ],
            [
                'key' => 'global_announcement_enabled',
                'value' => '0',
                'description' => null,
                'type' => 'boolean',
                'category' => 'general',
            ],
            [
                'key' => 'global_announcement_end_at',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'global_announcement_level',
                'value' => 'info',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'global_announcement_message',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'global_announcement_start_at',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'maintenance_banner_cta_label',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'maintenance_banner_cta_url',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],
            [
                'key' => 'maintenance_banner_enabled',
                'value' => '0',
                'description' => null,
                'type' => 'boolean',
                'category' => 'general',
            ],
            [
                'key' => 'maintenance_banner_message',
                'value' => '',
                'description' => null,
                'type' => 'string',
                'category' => 'general',
            ],

            // Legal
            [
                'key' => 'age_of_consent_text',
                'value' => 'You must be 18 or older to use this site.',
                'description' => 'Age of consent statement used in age gate and footers',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'cookie_policy_content',
                'value' => <<<'HTML'
<h1>Cookie Policy</h1>
<p><strong>Effective Date:</strong> {{effective_date}}</p>
<p>This Cookie Policy explains how {{site_name}} ("we," "us," or "our") uses cookies and similar tracking technologies when you visit our website at {{website_url}} (the "Platform"). This policy describes what cookies are, how we use them, the types of cookies we use, your choices regarding cookies, and how to contact us about our cookie practices.</p>

<h2>What Are Cookies</h2>
<p>Cookies are small text files that are placed on your device (computer, smartphone, tablet, or other electronic device) when you visit a website. Cookies allow the website to recognize your device and remember information about your visit, such as your preferences, login status, and browsing activity. Cookies are widely used to make websites work more efficiently and provide a better user experience.</p>
<p>In addition to cookies, we may use similar technologies such as web beacons, pixels, local storage, and software development kits (SDKs) that perform similar functions. For simplicity, we refer to all of these technologies collectively as "cookies" in this policy.</p>

<h2>Why We Use Cookies</h2>
<p>We use cookies for several important purposes:</p>
<ul>
  <li><strong>Essential Functionality:</strong> To enable core features of our Platform, including authentication, security, payment processing, and content delivery</li>
  <li><strong>Performance and Analytics:</strong> To understand how visitors use our Platform, identify technical issues, and improve our services</li>
  <li><strong>Personalization:</strong> To remember your preferences and provide you with a customized experience</li>
  <li><strong>Marketing:</strong> To deliver relevant advertisements and measure the effectiveness of our marketing campaigns</li>
  <li><strong>Security:</strong> To protect against fraud, abuse, and unauthorized access to your account</li>
</ul>

<h2>Types of Cookies We Use</h2>

<h3>1. Essential Cookies</h3>
<p>These cookies are strictly necessary for the Platform to function and cannot be disabled in our systems. They are usually set in response to actions you take, such as logging in, setting privacy preferences, or making payments. Without these cookies, core features of the Platform would not work properly.</p>
<p><strong>Examples of essential cookies include:</strong></p>
<ul>
  <li>Session cookies that maintain your logged-in status</li>
  <li>Authentication cookies that verify your identity</li>
  <li>Security cookies that detect and prevent fraudulent activity</li>
  <li>Payment processing cookies that facilitate secure transactions</li>
  <li>Age verification cookies that confirm you meet our 18+ age requirement</li>
  <li>Load balancing cookies that distribute traffic across our servers</li>
</ul>
<p><strong>Legal Basis:</strong> These cookies are necessary for the performance of our contract with you and to comply with legal obligations, including age verification requirements for adult content platforms.</p>

<h3>2. Analytics Cookies</h3>
<p>These cookies help us understand how visitors interact with our Platform by collecting and reporting information about your usage. This data is aggregated and anonymous, helping us improve the Platform's performance, functionality, and user experience.</p>
<p><strong>Analytics services we use:</strong></p>
<ul>
  <li><strong>Fathom Analytics:</strong> We use Fathom, a privacy-focused analytics service that does not track individuals or collect personal data. Fathom provides us with anonymous, aggregated statistics about website traffic and usage patterns. Fathom does not use cookies that identify individual users and is fully GDPR compliant. Learn more at <a href="https://usefathom.com/privacy" target="_blank">usefathom.com/privacy</a></li>
</ul>
<p><strong>Legal Basis:</strong> These cookies are used based on your consent, which you can withdraw at any time through your cookie preferences.</p>

<h3>3. Marketing and Advertising Cookies</h3>
<p>These cookies are used to deliver advertisements that are relevant to you and your interests. They may be set by us or by third-party advertising partners. These cookies may track your browsing activity across different websites and help measure the effectiveness of our advertising campaigns.</p>
<p><strong>What marketing cookies do:</strong></p>
<ul>
  <li>Deliver targeted advertisements based on your interests</li>
  <li>Limit the number of times you see an advertisement</li>
  <li>Measure the effectiveness of advertising campaigns</li>
  <li>Remember that you have visited our Platform when you visit other websites</li>
</ul>
<p><strong>Legal Basis:</strong> These cookies are used based on your consent, which you can withdraw at any time through your cookie preferences.</p>

<h2>Third-Party Cookies and Services</h2>
<p>We work with trusted third-party service providers who may set cookies on your device when you use our Platform. These third parties have their own privacy policies and cookie policies that govern their use of your information.</p>

<h3>Service Providers We Use</h3>

<h4>Infrastructure and Hosting</h4>
<p><strong>DigitalOcean:</strong> We use DigitalOcean for cloud hosting and infrastructure services. DigitalOcean may use cookies and similar technologies to provide, secure, and improve their services. For more information, visit <a href="https://www.digitalocean.com/legal/privacy-policy" target="_blank">DigitalOcean's Privacy Policy</a>.</p>

<h4>Payment Processing</h4>
<p><strong>CCBill:</strong> We use CCBill as our payment processor to handle subscription payments and transactions securely. CCBill may use cookies for fraud prevention, payment processing, and compliance purposes. CCBill maintains PCI-DSS compliance and adheres to strict data security standards. For more information, visit <a href="https://www.ccbill.com/privacy-policy" target="_blank">CCBill's Privacy Policy</a>.</p>

<h4>Analytics</h4>
<p><strong>Fathom Analytics:</strong> As described above, we use Fathom for privacy-respecting website analytics that does not track individual users or collect personal data.</p>

<h2>Your Cookie Choices and Control</h2>
<p>You have several options for managing and controlling cookies on our Platform:</p>

<h3>Cookie Consent Banner</h3>
<p>When you first visit {{site_name}}, you will see a cookie consent banner that allows you to accept or decline non-essential cookies. You can choose to:</p>
<ul>
  <li>Accept all cookies</li>
  <li>Accept only essential cookies</li>
  <li>Customize your cookie preferences by category</li>
</ul>

<h3>Cookie Preference Management</h3>
<p>You can change your cookie preferences at any time by accessing the cookie settings in your account dashboard or by clicking the "Cookie Preferences" link in our website footer. Through this interface, you can:</p>
<ul>
  <li>View detailed information about each cookie category</li>
  <li>Enable or disable specific cookie categories (except essential cookies)</li>
  <li>Withdraw your consent for previously accepted cookies</li>
</ul>

<h3>Browser Controls</h3>
<p>Most web browsers allow you to control cookies through their settings. You can typically:</p>
<ul>
  <li>View what cookies are stored on your device</li>
  <li>Delete cookies from your device</li>
  <li>Block cookies from being set</li>
  <li>Set your browser to notify you when a cookie is being set</li>
</ul>
<p>Please note that if you block or delete essential cookies, certain features of the Platform may not function properly, and you may not be able to access your account or use our services.</p>
<p>To learn how to manage cookies in your specific browser, visit your browser's help documentation:</p>
<ul>
  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank">Google Chrome</a></li>
  <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank">Mozilla Firefox</a></li>
  <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank">Safari</a></li>
  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank">Microsoft Edge</a></li>
</ul>

<h3>Opt-Out of Interest-Based Advertising</h3>
<p>You can opt out of interest-based advertising from participating companies through industry opt-out programs:</p>
<ul>
  <li><a href="http://www.aboutads.info/choices/" target="_blank">Digital Advertising Alliance (DAA)</a></li>
  <li><a href="https://www.networkadvertising.org/choices/" target="_blank">Network Advertising Initiative (NAI)</a></li>
  <li><a href="http://www.youronlinechoices.eu/" target="_blank">European Interactive Digital Advertising Alliance (EDAA)</a></li>
</ul>
<p>Please note that opting out does not mean you will stop seeing advertisements; it means the advertisements you see will be less relevant to your interests.</p>

<h2>Cookie Duration</h2>
<p>Cookies can be either session cookies or persistent cookies:</p>
<ul>
  <li><strong>Session Cookies:</strong> These are temporary cookies that expire when you close your browser. They are used for essential functions like maintaining your login session.</li>
  <li><strong>Persistent Cookies:</strong> These cookies remain on your device for a set period or until you delete them. They are used to remember your preferences and settings across multiple visits.</li>
</ul>
<p>The specific duration of each cookie varies depending on its purpose. Essential cookies typically remain active for the duration of your session or for a period necessary to maintain security and functionality. Analytics and marketing cookies may persist for longer periods, typically ranging from a few days to two years.</p>

<h2>International Data Transfers</h2>
<p>{{site_name}} operates globally and may transfer and store your information, including cookie data, in countries outside of your jurisdiction. These countries may have different data protection laws than your country of residence. When we transfer data internationally, we implement appropriate safeguards to protect your information in accordance with applicable data protection laws, including:</p>
<ul>
  <li>Standard Contractual Clauses approved by the European Commission for transfers from the EU/EEA</li>
  <li>Data processing agreements with our service providers</li>
  <li>Adherence to recognized data protection frameworks and certifications</li>
</ul>

<h2>Your Rights and Choices Under Data Protection Laws</h2>

<h3>European Economic Area (EEA), UK, and Switzerland</h3>
<p>If you are located in the EEA, UK, or Switzerland, you have the following rights under the General Data Protection Regulation (GDPR):</p>
<ul>
  <li><strong>Right to Access:</strong> Request information about the personal data we collect through cookies</li>
  <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal data</li>
  <li><strong>Right to Erasure:</strong> Request deletion of your personal data in certain circumstances</li>
  <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your personal data</li>
  <li><strong>Right to Data Portability:</strong> Request a copy of your personal data in a structured format</li>
  <li><strong>Right to Object:</strong> Object to our processing of your personal data for marketing purposes</li>
  <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for cookie use at any time</li>
</ul>

<h3>California Residents</h3>
<p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), including:</p>
<ul>
  <li><strong>Right to Know:</strong> Request information about the categories and specific pieces of personal information we collect</li>
  <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
  <li><strong>Right to Opt-Out:</strong> Opt out of the "sale" or "sharing" of your personal information (including through cookies for targeted advertising)</li>
  <li><strong>Right to Non-Discrimination:</strong> Receive equal service and pricing even if you exercise your privacy rights</li>
</ul>
<p>To exercise these rights, please contact us using the information provided in the Contact Us section below.</p>

<h3>Other Jurisdictions</h3>
<p>We respect privacy rights under all applicable data protection laws worldwide. If you have questions about your rights in your specific jurisdiction, please contact us at {{privacy_email}}.</p>

<h2>Do Not Track Signals</h2>
<p>Some web browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want to have your online activity tracked. Currently, there is no universal standard for how websites should respond to DNT signals. At this time, our Platform does not respond to DNT signals, but you can use the cookie preference tools described above to control tracking.</p>

<h2>Age Restrictions and Cookies</h2>
<p>{{site_name}} is an age-restricted platform intended only for users who are 18 years of age or older. We do not knowingly collect information from or direct any of our content or services to individuals under the age of 18. If you are under 18, you must not use our Platform or services. We may use cookies as part of our age verification processes to ensure compliance with this requirement.</p>

<h2>Updates to This Cookie Policy</h2>
<p>We may update this Cookie Policy from time to time to reflect changes in our cookie practices, legal requirements, or business operations. When we make material changes to this policy, we will notify you by:</p>
<ul>
  <li>Updating the "Effective Date" at the top of this policy</li>
  <li>Displaying a prominent notice on the Platform</li>
  <li>Sending you an email notification (if you have provided us with your email address)</li>
</ul>
<p>We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies. Your continued use of the Platform after changes to this policy constitutes your acceptance of the updated terms.</p>

<h2>Contact Us</h2>
<p>If you have any questions, concerns, or requests regarding this Cookie Policy or our use of cookies, please contact us:</p>
<p>
  <strong>{{company_name}}</strong><br />
  Email: {{privacy_email}}<br /><br />
  Legal Inquiries: {{legal_email}}<br />
  General Support: {{support_email}}<br />
</p>
<p>We will respond to your inquiry within a reasonable timeframe, typically within 30 days for data protection rights requests.</p>

<h2>Additional Resources</h2>
<p>For more information about cookies and online privacy, you may find the following resources helpful:</p>
<ul>
  <li><a href="https://www.allaboutcookies.org/" target="_blank">All About Cookies</a></li>
  <li><a href="https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/" target="_blank">UK Information Commissioner's Office - Cookies</a></li>
  <li><a href="https://edps.europa.eu/data-protection/our-work/subjects/cookies_en" target="_blank">European Data Protection Supervisor - Cookies</a></li>
</ul>
HTML,
                'description' => 'Cookie Policy content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'dmca_policy_content',
                'value' => <<<'HTML'
<h1>Digital Millennium Copyright Act (DMCA) Policy</h1>
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
  Email: {{dmca_email}}<br /><br />
  Legal: {{legal_email}}<br />Support: {{support_email}} <br />Abuse: {{abuse_email}}<br />
</p>
HTML,
                'description' => 'DMCA Policy content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'guidelines_content',
                'value' => <<<'HTML'
<h1>Community Guidelines</h1>
<p><strong>Effective Date:</strong> {{effective_date}}</p>
<p>Welcome to {{site_name}}. These Community Guidelines explain what is and isn't allowed on our platform. These guidelines apply to all users, including content creators and subscribers, and cover all content, interactions, and activities on {{site_name}}. By using our platform, you agree to follow these guidelines. Failure to comply may result in content removal, account restrictions, or permanent termination of your account.</p>
<p>We are committed to maintaining a safe, respectful, and legal platform for adult content creators and their audiences. While we support freedom of expression and creative content, we have zero tolerance for illegal activity, non-consensual content, and behavior that harms others.</p>

<h2>Age Requirement</h2>
<p>{{site_name}} is an adult platform. You must be at least 18 years old to use our services in any capacity. All content creators must complete our mandatory identity verification process to confirm they meet this age requirement before creating or sharing content. We employ robust age verification systems and work with trusted third-party verification services to ensure compliance.</p>
<p>Any attempt to access or use the platform while under 18 years of age is strictly prohibited and may result in immediate account termination and reporting to appropriate authorities.</p>

<h2>Prohibited Content and Activities</h2>
<p>The following content and activities are strictly prohibited on {{site_name}}. Violations will result in immediate content removal and may lead to account suspension or termination, as well as reporting to law enforcement where applicable.</p>

<h3>Illegal Content</h3>
<ul>
  <li><strong>Child Sexual Abuse Material (CSAM):</strong> Any content depicting, promoting, or soliciting sexual content involving minors (anyone under 18 years of age) is absolutely prohibited. This includes drawn, animated, or digitally created content. We have zero tolerance for this content and will immediately report any instances to the National Center for Missing & Exploited Children (NCMEC) and law enforcement.</li>
  <li><strong>Non-Consensual Content:</strong> Content created, shared, or distributed without the consent of all individuals depicted, including but not limited to:
    <ul>
      <li>Revenge porn or intimate images shared without consent</li>
      <li>Hidden camera or voyeuristic content</li>
      <li>Deepfakes or manipulated media depicting real individuals without consent</li>
      <li>Content obtained through hacking, theft, or unauthorized access</li>
      <li>Upskirt, downblouse, or other non-consensual recordings</li>
    </ul>
  </li>
  <li><strong>Sex Trafficking and Exploitation:</strong> Content or activity involving human trafficking, forced sexual activity, sexual slavery, or exploitation of any kind</li>
  <li><strong>Incest:</strong> Content depicting or promoting sexual activity between family members or individuals presented as family members</li>
  <li><strong>Bestiality:</strong> Content depicting or promoting sexual activity between humans and animals</li>
  <li><strong>Necrophilia:</strong> Content depicting or promoting sexual activity with deceased individuals</li>
  <li><strong>Violent or Extreme Content:</strong> Content depicting or promoting:
    <ul>
      <li>Rape, sexual assault, or sexual violence</li>
      <li>Torture or extreme physical harm</li>
      <li>Self-harm, suicide, or encouragement of such acts</li>
      <li>Mutilation or grievous bodily harm</li>
      <li>Snuff content or realistic depictions of death</li>
    </ul>
  </li>
  <li><strong>Illegal Substances and Activities:</strong> Content promoting, facilitating, or depicting illegal drug use, drug sales, or other illegal activities</li>
</ul>

<h3>Prohibited Behavior and Conduct</h3>
<ul>
  <li><strong>Harassment and Bullying:</strong> Any form of harassment, bullying, stalking, intimidation, or threatening behavior toward other users, including:
    <ul>
      <li>Persistent unwanted contact or messages</li>
      <li>Threats of violence or harm</li>
      <li>Doxxing (sharing private personal information)</li>
      <li>Coordinated harassment campaigns</li>
      <li>Sexual harassment or unwanted sexual advances</li>
    </ul>
  </li>
  <li><strong>Hate Speech and Discrimination:</strong> Content or behavior that promotes, encourages, or incites hatred, violence, or discrimination based on:
    <ul>
      <li>Race, ethnicity, or national origin</li>
      <li>Religion or religious beliefs</li>
      <li>Sexual orientation or gender identity</li>
      <li>Disability or medical condition</li>
      <li>Age or any other protected characteristic</li>
    </ul>
  </li>
  <li><strong>Impersonation and Misrepresentation:</strong> Impersonating another person, brand, or entity, or creating fake or misleading accounts. This includes:
    <ul>
      <li>Using another person's name, image, or likeness without permission</li>
      <li>Creating parody or fan accounts without clear disclosure</li>
      <li>Catfishing or using false identities to deceive others</li>
      <li>Misrepresenting your identity, age, or verification status</li>
    </ul>
  </li>
  <li><strong>Spam and Scams:</strong> Spam, phishing, scams, pyramid schemes, or fraudulent activity, including:
    <ul>
      <li>Mass unsolicited messages or advertisements</li>
      <li>Fake giveaways or contests</li>
      <li>Phishing attempts or requests for personal/financial information</li>
      <li>Multi-level marketing or pyramid schemes</li>
      <li>Financial scams or investment fraud</li>
    </ul>
  </li>
  <li><strong>Intellectual Property Violations:</strong> Sharing, uploading, or distributing content that infringes on the intellectual property rights of others, including:
    <ul>
      <li>Copyrighted content you don't own or have permission to use</li>
      <li>Unauthorized use of trademarks, logos, or brand names</li>
      <li>Content from other creators without proper authorization</li>
      <li>Pirated or stolen content from other platforms</li>
    </ul>
    See our DMCA Policy for information about reporting copyright infringement.
  </li>
  <li><strong>Weapons and Dangerous Goods:</strong> Promoting, selling, or facilitating the sale of weapons, firearms, explosives, or other dangerous items</li>
  <li><strong>Terrorism and Violent Extremism:</strong> Content promoting, supporting, or glorifying terrorism, terrorist organizations, or violent extremist groups</li>
</ul>

<h2>Creator Responsibilities</h2>
<p>Content creators on {{site_name}} have additional responsibilities to ensure they operate in compliance with our guidelines and applicable laws.</p>

<h3>Identity and Age Verification</h3>
<ul>
  <li>All creators must complete our mandatory identity verification process before creating or sharing content</li>
  <li>You must provide accurate, truthful information during the verification process</li>
  <li>You must be the person depicted in the verification documents submitted</li>
  <li>You may be required to re-verify your identity periodically or upon request</li>
  <li>Attempting to circumvent or falsify the verification process will result in immediate permanent account termination</li>
</ul>

<h3>Content Authenticity and Rights</h3>
<ul>
  <li>You must have the legal right to share all content you upload</li>
  <li>You must own the content or have explicit permission from the copyright holder</li>
  <li>All individuals appearing in your content must be 18 years or older and must have consented to being filmed and to having the content shared on {{site_name}}</li>
  <li>You must maintain records demonstrating consent and age verification for all individuals appearing in your content (model releases, IDs, consent forms)</li>
  <li>If requested by {{site_name}}, you must be able to provide documentation proving you have the right to share the content and that all individuals depicted have consented</li>
</ul>

<h3>Accurate Representation and Transparency</h3>
<ul>
  <li>Content descriptions, titles, and previews must accurately represent the content being offered</li>
  <li>Pricing must be clear and transparent; you cannot mislead users about what content they will receive for a subscription or purchase</li>
  <li>You must honor the terms you set for subscriptions, tips, and paid content</li>
  <li>You cannot use clickbait, false advertising, or deceptive practices to attract subscribers</li>
  <li>If you offer custom content or requests, you must fulfill them as agreed or provide appropriate refunds</li>
</ul>

<h3>Creator Conduct in Interactions</h3>
<ul>
  <li>Treat subscribers with respect; harassment, discrimination, or abusive behavior toward subscribers is prohibited</li>
  <li>Do not pressure or manipulate subscribers into purchasing content or sending tips</li>
  <li>Do not share subscriber information with third parties without consent</li>
  <li>Respect subscriber boundaries and privacy</li>
  <li>Do not engage in scams, catfishing, or other deceptive practices</li>
</ul>

<h3>Off-Platform Conduct</h3>
<ul>
  <li>You must not attempt to circumvent the platform by directing subscribers to conduct transactions outside of {{site_name}} to avoid fees</li>
  <li>You must not use {{site_name}} solely to advertise or redirect users to other platforms or services without providing content on our platform</li>
  <li>Sharing personal contact information or payment information with subscribers for the purpose of conducting off-platform transactions is prohibited</li>
</ul>

<h3>Live Streaming Guidelines</h3>
<ul>
  <li>All live stream participants must be verified and 18 years or older</li>
  <li>Live streams must comply with all prohibited content guidelines</li>
  <li>You are responsible for all content and interactions that occur during your live streams</li>
  <li>You must moderate your live chat to prevent harassment, hate speech, or other prohibited behavior</li>
  <li>Dangerous stunts, illegal activities, or harmful behavior during live streams are prohibited</li>
  <li>You must not stream from private property without permission or in locations where streaming is prohibited by law</li>
</ul>

<h2>Subscriber Responsibilities</h2>
<p>Subscribers also have responsibilities to maintain a safe and respectful community.</p>

<h3>Respect and Appropriate Conduct</h3>
<ul>
  <li>Treat content creators and other users with respect</li>
  <li>Do not harass, stalk, threaten, or engage in abusive behavior toward creators or other subscribers</li>
  <li>Do not send unsolicited sexual content, requests, or messages to creators who have not consented to receive them</li>
  <li>Respect creators' boundaries, prices, and content offerings</li>
  <li>Do not attempt to manipulate, coerce, or pressure creators into providing content or services outside their stated terms</li>
</ul>

<h3>Content Usage and Redistribution</h3>
<ul>
  <li>Content you purchase or access through subscriptions is for your personal use only</li>
  <li>You must not record, screenshot, download, reproduce, or redistribute creators' content without explicit written permission</li>
  <li>Sharing account credentials or allowing others to access your account to view purchased content is prohibited</li>
  <li>Posting or sharing creators' content on other websites, forums, or platforms is a violation of copyright law and these guidelines</li>
  <li>We employ digital rights management (DRM) and watermarking technologies to prevent unauthorized distribution</li>
</ul>

<h3>Payment and Financial Conduct</h3>
<ul>
  <li>You must use legitimate payment methods and provide accurate billing information</li>
  <li>Fraudulent chargebacks or payment disputes made in bad faith are prohibited and may result in permanent account termination</li>
  <li>If you have a legitimate dispute about content or charges, contact {{support_email}} rather than initiating a chargeback</li>
  <li>You are responsible for all charges made through your account</li>
</ul>

<h3>Messaging and Communication</h3>
<ul>
  <li>Do not spam creators or other users with unwanted messages</li>
  <li>Respect creators' response times and availability</li>
  <li>Do not use the messaging system to harass, solicit, or engage in prohibited conduct</li>
  <li>Do not share personal contact information with the intent of taking transactions off-platform</li>
</ul>

<h2>Platform Integrity and Security</h2>
<p>All users must respect the integrity and security of {{site_name}}.</p>

<h3>Account Security</h3>
<ul>
  <li>You are responsible for maintaining the security of your account credentials</li>
  <li>You must not share your account password or access with others</li>
  <li>You must notify us immediately if you believe your account has been compromised</li>
  <li>You must not attempt to access other users' accounts without authorization</li>
</ul>

<h3>Technical Restrictions</h3>
<ul>
  <li>You must not attempt to hack, compromise, or gain unauthorized access to the platform or other users' accounts</li>
  <li>You must not use bots, scrapers, or automated tools to access or interact with the platform without explicit permission</li>
  <li>You must not attempt to circumvent security measures, DRM, watermarks, or technological protection measures</li>
  <li>You must not reverse engineer, decompile, or attempt to extract source code from the platform</li>
  <li>You must not introduce malware, viruses, or malicious code to the platform</li>
  <li>You must not engage in denial-of-service attacks or attempt to disrupt platform services</li>
</ul>

<h3>Manipulation and Gaming</h3>
<ul>
  <li>You must not artificially inflate engagement metrics (views, likes, followers) through bots, fake accounts, or manipulation</li>
  <li>You must not engage in vote manipulation, review fraud, or fake engagement schemes</li>
  <li>You must not create multiple accounts to circumvent restrictions or bans</li>
</ul>

<h2>Reporting Violations</h2>
<p>We rely on our community to help keep {{site_name}} safe. If you encounter content or behavior that violates these guidelines, please report it immediately.</p>

<h3>How to Report</h3>
<p>You can report violations through:</p>
<ul>
  <li>The "Report" button available on all content, profiles, and messages</li>
  <li>Email: {{abuse_email}}</li>
  <li>Our online reporting form available in your account settings</li>
</ul>

<h3>What to Include in Reports</h3>
<p>When reporting a violation, please provide:</p>
<ul>
  <li>The username or profile URL of the user involved</li>
  <li>The specific content URL or description of the violation</li>
  <li>A clear description of why you believe the content or behavior violates our guidelines</li>
  <li>Any relevant screenshots, timestamps, or supporting evidence</li>
  <li>Your contact information (kept confidential)</li>
</ul>

<h3>Report Review Process</h3>
<ul>
  <li>All reports are reviewed by our Trust & Safety team</li>
  <li>We aim to review reports within 24-48 hours, though complex cases may take longer</li>
  <li>For reports involving illegal content, we prioritize immediate review and may involve law enforcement</li>
  <li>You will receive confirmation that your report has been received</li>
  <li>Due to privacy considerations, we may not be able to share specific details about actions taken</li>
</ul>

<h3>False Reporting</h3>
<p>Submitting false, malicious, or bad-faith reports is a violation of these guidelines. Repeatedly filing false reports may result in account restrictions or termination. We take all reports seriously and expect users to do the same.</p>

<h2>Enforcement and Consequences</h2>
<p>When we determine that a user has violated these Community Guidelines, we take appropriate action based on the severity and frequency of the violation.</p>

<h3>Range of Actions</h3>
<p>Depending on the violation, we may take one or more of the following actions:</p>
<ul>
  <li><strong>Warning:</strong> First-time minor violations may result in a warning with an explanation of the violation and guidance on how to comply with our guidelines</li>
  <li><strong>Content Removal:</strong> We may remove specific content that violates our guidelines while allowing your account to remain active</li>
  <li><strong>Account Restrictions:</strong> We may temporarily restrict certain features, such as:
    <ul>
      <li>Disabling messaging or commenting capabilities</li>
      <li>Preventing new subscriptions or purchases</li>
      <li>Limiting live streaming access</li>
      <li>Restricting content uploads</li>
    </ul>
  </li>
  <li><strong>Temporary Suspension:</strong> Your account may be temporarily suspended for a specified period, during which you cannot access the platform</li>
  <li><strong>Permanent Termination:</strong> Serious or repeated violations will result in permanent account termination and loss of access to all content and earnings</li>
  <li><strong>Legal Action:</strong> For illegal activities, we may report violations to law enforcement and cooperate with investigations</li>
  <li><strong>Financial Consequences:</strong> For creators, violations may result in withholding or forfeiture of earnings, refunds to affected subscribers, or payment processing restrictions</li>
</ul>

<h3>Immediate Termination Violations</h3>
<p>The following violations will result in immediate permanent account termination without prior warning:</p>
<ul>
  <li>Child sexual abuse material or exploitation</li>
  <li>Non-consensual intimate content</li>
  <li>Sex trafficking or exploitation</li>
  <li>Violent or extreme illegal content</li>
  <li>Terrorism or violent extremism</li>
  <li>Attempting to circumvent or falsify age/identity verification</li>
  <li>Repeated serious violations after multiple warnings or suspensions</li>
</ul>

<h3>Repeat Offender Policy</h3>
<p>We track violations and take progressively stronger action against repeat offenders:</p>
<ul>
  <li><strong>First violation:</strong> Warning or content removal (for minor violations)</li>
  <li><strong>Second violation:</strong> Temporary suspension and account restrictions</li>
  <li><strong>Third violation:</strong> Extended suspension with potential permanent restrictions</li>
  <li><strong>Fourth violation or beyond:</strong> Permanent account termination</li>
</ul>
<p>Note that serious violations may result in immediate termination regardless of prior history.</p>

<h3>Appeals Process</h3>
<p>If you believe we made a mistake in enforcing these guidelines, you may appeal our decision:</p>
<ul>
  <li>You have 14 days from the date of the enforcement action to submit an appeal</li>
  <li>Submit appeals to {{legal_email}} with the subject line "Community Guidelines Appeal"</li>
  <li>Include your username, the specific violation cited, and a detailed explanation of why you believe the decision should be reconsidered</li>
  <li>Provide any supporting evidence or context that may be relevant</li>
  <li>Our Trust & Safety team will review your appeal and respond within 7-14 business days</li>
  <li>Appeal decisions are final; repeated appeals of the same decision will not be reviewed</li>
</ul>

<h2>Cooperation with Law Enforcement</h2>
<p>{{site_name}} cooperates fully with law enforcement agencies investigating illegal activity. When we become aware of illegal content or activity, particularly involving child exploitation, sex trafficking, or other serious crimes, we will:</p>
<ul>
  <li>Immediately remove the content and preserve evidence</li>
  <li>Report the activity to appropriate law enforcement agencies</li>
  <li>Report child sexual abuse material to the National Center for Missing & Exploited Children (NCMEC)</li>
  <li>Comply with valid legal requests for user information and account data</li>
  <li>Cooperate with investigations to the fullest extent permitted by law</li>
</ul>

<h2>Content Moderation</h2>
<p>We use a combination of automated systems and human review to enforce these Community Guidelines:</p>
<ul>
  <li><strong>Proactive Detection:</strong> Automated systems scan for known illegal content, prohibited keywords, and suspicious patterns</li>
  <li><strong>User Reports:</strong> Community reports are reviewed by our Trust & Safety team</li>
  <li><strong>Human Review:</strong> Trained moderators review flagged content and make enforcement decisions</li>
  <li><strong>Age Verification:</strong> Advanced identity verification systems confirm user age before content creation</li>
  <li><strong>Content Fingerprinting:</strong> We maintain databases of known illegal content to prevent re-uploads</li>
</ul>
<p>While we work diligently to identify and remove violating content, we cannot guarantee that all violations will be detected immediately. We rely on our community to report violations they encounter.</p>

<h2>Platform Discretion</h2>
<p>These Community Guidelines provide general guidance, but we cannot anticipate every possible situation. {{site_name}} reserves the right to:</p>
<ul>
  <li>Remove content or restrict accounts that we believe violate the spirit of these guidelines, even if not explicitly listed</li>
  <li>Make exceptions to these guidelines in our sole discretion where appropriate</li>
  <li>Update these guidelines at any time to address new issues or clarify existing policies</li>
  <li>Interpret these guidelines and make enforcement decisions in our sole discretion</li>
</ul>
<p>Our goal is to maintain a safe, legal, and respectful platform. We will always err on the side of safety and protecting our community.</p>

<h2>Updates to Community Guidelines</h2>
<p>We may update these Community Guidelines from time to time to reflect changes in our platform, applicable laws, or community standards. When we make material changes, we will:</p>
<ul>
  <li>Update the "Effective Date" at the top of these guidelines</li>
  <li>Notify users through email and platform notifications</li>
  <li>Provide a reasonable period for users to review changes before they take effect</li>
</ul>
<p>Continued use of {{site_name}} after changes to these guidelines constitutes acceptance of the updated terms.</p>

<h2>Additional Policies</h2>
<p>These Community Guidelines work together with our other policies:</p>
<ul>
  <li><a href="{{website_url}}/legal/terms-of-service">Terms of Service</a> - Legal agreement governing your use of the platform</li>
  <li><a href="{{website_url}}/legal/privacy-policy">Privacy Policy</a> - How we collect, use, and protect your data</li>
  <li><a href="{{website_url}}/legal/dmca-policy">DMCA Policy</a> - How we handle copyright infringement claims</li>
  <li><a href="{{website_url}}/legal/cookie-policy">Cookie Policy</a> - How we use cookies and tracking technologies</li>
</ul>
<p>All policies must be followed. If there is a conflict between these guidelines and other policies, the more restrictive provision applies.</p>

<h2>Contact Us</h2>
<p>If you have questions about these Community Guidelines or need to report a violation, please contact us:</p>
<p>
  <strong>{{site_name}}</strong><br />
  Trust & Safety Team<br />
  Email: {{abuse_email}}<br /><br />
  Legal Inquiries: {{legal_email}}<br />
  General Support: {{support_email}}<br />
</p>

<h2>Final Note</h2>
<p>{{site_name}} is a community built on trust, respect, and mutual support between creators and their audiences. We expect all users to contribute to a positive environment where creators can share their work safely and subscribers can enjoy content responsibly. Thank you for helping us maintain a platform we can all be proud of.</p>
<p>By using {{site_name}}, you acknowledge that you have read, understood, and agree to abide by these Community Guidelines.</p>
HTML,
                'description' => 'Community Guidelines content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'privacy_content',
                'value' => <<<'HTML'
<h1>Privacy Policy</h1>
<p><strong>Effective Date:</strong> {{effective_date}}</p>
<p>This Privacy Policy describes how {{company_name}} ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use {{site_name}} (the "Platform"), accessible at {{website_url}}. This policy applies to all users, including content creators and subscribers.</p>
<p>We are committed to protecting your privacy and handling your personal information with care and transparency. This policy explains what information we collect, how we use it, who we share it with, and your rights and choices regarding your personal information.</p>
<p>By using {{site_name}}, you agree to the collection, use, and sharing of your information as described in this Privacy Policy. If you do not agree with this policy, please do not use our Platform.</p>

<h2>Information We Collect</h2>
<p>We collect several types of information from and about users of our Platform, including information you provide directly, information we collect automatically, and information from third-party sources.</p>

<h3>1. Account and Registration Information</h3>
<p>When you create an account on {{site_name}}, we collect:</p>
<ul>
  <li><strong>Basic Account Information:</strong> Email address, username, password (stored in encrypted form), and date of birth</li>
  <li><strong>Profile Information:</strong> Display name, profile photo, bio/description, social media links, gender, pronouns, location/country, and any other information you choose to include in your public profile</li>
  <li><strong>Account Preferences:</strong> Communication preferences, privacy settings, notification settings, language preferences, and content preferences</li>
</ul>

<h3>2. Identity Verification Information (Content Creators)</h3>
<p>Content creators must complete mandatory identity verification before creating or sharing content. During this process, we collect:</p>
<ul>
  <li><strong>Government-Issued Identification:</strong> Images of your passport, driver's license, national ID card, or other government-issued identification documents containing your full legal name, date of birth, photo, and document number</li>
  <li><strong>Verification Photos:</strong> Selfie photos or videos for facial comparison to verify your identity matches your identification documents</li>
  <li><strong>Additional Creator Information:</strong> Legal name, business name (if applicable), mailing address, and any other information required to verify your identity and eligibility to create content</li>
</ul>
<p>We work with trusted third-party identity verification service providers to process and verify this information. These providers may retain copies of your identification documents in accordance with their own privacy policies and applicable legal requirements.</p>

<h3>3. Payment and Financial Information</h3>
<p>When you make purchases, subscribe to creators, send tips, or receive payments as a creator, we collect:</p>
<ul>
  <li><strong>Payment Information (Subscribers):</strong> Billing name, billing address, and payment method details. Payment card information (credit/debit card numbers, CVV, expiration dates) is collected and processed directly by our payment processor, CCBill, and is not stored on our servers. See the "Payment Processing" section below for more details.</li>
  <li><strong>Transaction History:</strong> Records of all subscriptions, purchases, tips, and payments made or received through the Platform, including transaction amounts, dates, and involved parties</li>
  <li><strong>Payout Information (Creators):</strong> Bank account details, routing numbers, account holder names, and other information necessary to process payouts to content creators</li>
  <li><strong>Tax Information (Creators):</strong> For creators who earn above certain thresholds, we may collect information necessary for tax reporting purposes in compliance with applicable laws</li>
  <li><strong>Earnings and Financial Records:</strong> Records of earnings, payouts, refunds, chargebacks, and other financial transactions related to your creator account</li>
</ul>

<h3>4. Content and Communications</h3>
<p>When you use {{site_name}}, we collect and store:</p>
<ul>
  <li><strong>User-Generated Content:</strong> All content you create, upload, or share on the Platform, including photos, videos, audio, text posts, captions, descriptions, and metadata associated with this content</li>
  <li><strong>Messages and Communications:</strong> Direct messages, chat conversations, comments, and other communications you send or receive through the Platform</li>
  <li><strong>Live Streams:</strong> Content from live streams you broadcast or view, including recordings, chat logs, and participant information</li>
  <li><strong>Interactions and Engagement:</strong> Your likes, favorites, subscriptions, follows, blocks, reports, and other interactions with content and users</li>
  <li><strong>Customer Support Communications:</strong> Any information you provide when contacting our customer support team, including support tickets, emails, and attachments</li>
</ul>

<h3>5. Automatically Collected Information</h3>
<p>When you access or use our Platform, we automatically collect certain information:</p>
<ul>
  <li><strong>Device Information:</strong> Device type, operating system, browser type and version, device identifiers (such as IDFA or Android ID), screen resolution, and mobile network information</li>
  <li><strong>Usage Information:</strong> Pages or content you view, features you use, search queries, time spent on pages, navigation paths, referring/exit pages, and other usage statistics</li>
  <li><strong>Log Information:</strong> IP address, access times, error logs, crash reports, and other system activity</li>
  <li><strong>Location Information:</strong> General geographic location (country, state/province, city) derived from your IP address or device settings. We do not collect precise GPS location data.</li>
  <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, pixels, and similar tracking technologies to collect information about your browsing activity. For more information, please see our <a href="{{website_url}}/legal/cookie-policy">Cookie Policy</a>.</li>
</ul>

<h3>6. Information from Third-Party Sources</h3>
<p>We may receive information about you from third-party sources, including:</p>
<ul>
  <li><strong>Identity Verification Services:</strong> Information from third-party identity verification providers used to confirm your age and identity</li>
  <li><strong>Payment Processors:</strong> Transaction confirmation, payment status, and fraud prevention information from CCBill and other payment service providers</li>
  <li><strong>Public Sources:</strong> Information from publicly available sources, such as social media profiles you link to your account</li>
  <li><strong>Fraud Prevention Services:</strong> Information from fraud detection and prevention services to help protect against fraudulent transactions and abuse</li>
  <li><strong>Analytics Providers:</strong> Aggregated, anonymized analytics data from Fathom Analytics regarding overall platform usage and performance</li>
</ul>

<h3>7. Sensitive Personal Information</h3>
<p>As an adult content platform, certain information you provide or that we collect may be considered sensitive or special category data under applicable privacy laws:</p>
<ul>
  <li><strong>Adult Content Viewing:</strong> Your viewing, subscription, and interaction history with adult content is considered sensitive information</li>
  <li><strong>Sexual Content Creation:</strong> Content you create or share that is sexual in nature</li>
  <li><strong>Government Identification:</strong> ID documents collected for verification purposes contain sensitive personal data</li>
  <li><strong>Financial Information:</strong> Payment and banking information is considered sensitive financial data</li>
</ul>
<p>We handle all sensitive information with heightened security measures and only use it for the specific purposes outlined in this policy. Where required by law, we obtain your explicit consent before processing sensitive personal information.</p>

<h2>How We Use Your Information</h2>
<p>We use the information we collect for the following purposes:</p>

<h3>1. Providing and Maintaining Our Services</h3>
<ul>
  <li>Create, maintain, and manage your account</li>
  <li>Enable you to create, upload, share, and monetize content</li>
  <li>Process subscriptions, purchases, tips, and payments</li>
  <li>Facilitate messaging, comments, and other communications between users</li>
  <li>Provide customer support and respond to your inquiries</li>
  <li>Enable live streaming and real-time interactions</li>
  <li>Deliver personalized content recommendations and search results</li>
</ul>

<h3>2. Verification and Safety</h3>
<ul>
  <li>Verify your age and identity to ensure compliance with our 18+ age requirement</li>
  <li>Verify content creator eligibility and authenticity</li>
  <li>Detect, investigate, and prevent fraud, abuse, and illegal activity</li>
  <li>Enforce our Terms of Service, Community Guidelines, and other policies</li>
  <li>Protect the safety and security of our users and Platform</li>
  <li>Respond to legal requests and prevent harm</li>
  <li>Monitor and moderate content for policy violations</li>
</ul>

<h3>3. Platform Improvement and Analytics</h3>
<ul>
  <li>Analyze usage patterns and trends to improve Platform performance and user experience</li>
  <li>Develop new features, products, and services</li>
  <li>Conduct research and analytics to understand user behavior</li>
  <li>Test and troubleshoot new features and functionality</li>
  <li>Optimize content delivery and platform infrastructure</li>
</ul>

<h3>4. Communications</h3>
<ul>
  <li>Send you transactional emails and notifications (purchase confirmations, payout notifications, security alerts)</li>
  <li>Send you service-related announcements and updates</li>
  <li>Respond to your questions, comments, and support requests</li>
  <li>Send you marketing communications about new features, promotions, or updates (with your consent where required)</li>
  <li>Notify you about changes to our policies or services</li>
</ul>

<h3>5. Legal and Compliance</h3>
<ul>
  <li>Comply with applicable laws, regulations, and legal processes</li>
  <li>Respond to law enforcement requests and court orders</li>
  <li>Process tax reporting and withholding requirements</li>
  <li>Maintain records for audit and compliance purposes</li>
  <li>Protect our legal rights and interests</li>
  <li>Report child sexual abuse material (CSAM) to the National Center for Missing & Exploited Children (NCMEC) as required by law</li>
</ul>

<h3>6. Marketing and Advertising</h3>
<ul>
  <li>Display relevant advertisements (with your consent where required)</li>
  <li>Measure advertising effectiveness</li>
  <li>Send promotional emails and notifications (you can opt out at any time)</li>
  <li>Conduct marketing campaigns to attract new users</li>
</ul>

<h2>Legal Basis for Processing (GDPR)</h2>
<p>If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, we process your personal information based on the following legal grounds:</p>
<ul>
  <li><strong>Contractual Necessity:</strong> Processing is necessary to perform our contract with you (Terms of Service) and provide our services</li>
  <li><strong>Legal Obligation:</strong> Processing is necessary to comply with legal requirements, such as age verification, tax reporting, and responding to law enforcement requests</li>
  <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests in operating, improving, and securing the Platform, preventing fraud, and enforcing our policies, provided these interests are not overridden by your rights</li>
  <li><strong>Consent:</strong> For certain processing activities, such as marketing communications or non-essential cookies, we rely on your explicit consent, which you can withdraw at any time</li>
  <li><strong>Vital Interests:</strong> In rare cases, processing may be necessary to protect someone's life or physical safety</li>
</ul>

<h2>How We Share Your Information</h2>
<p>We do not sell your personal information to third parties. We may share your information in the following circumstances:</p>

<h3>1. With Other Users</h3>
<ul>
  <li><strong>Public Profile Information:</strong> Your username, display name, profile photo, bio, and public posts are visible to other users of the Platform</li>
  <li><strong>Content You Share:</strong> Content you upload, share, or make available to subscribers is accessible to those users</li>
  <li><strong>Messages and Interactions:</strong> Messages you send and interactions you make (likes, comments) are visible to the recipients</li>
  <li><strong>Creator-Subscriber Relationships:</strong> Creators can see information about their subscribers, including usernames and subscription status</li>
</ul>

<h3>2. Service Providers and Business Partners</h3>
<p>We share information with trusted third-party service providers who perform services on our behalf:</p>
<ul>
  <li><strong>Payment Processing:</strong> CCBill processes all payment transactions and collects payment information directly from subscribers. CCBill operates under its own privacy policy and security standards. We share necessary transaction information with CCBill to facilitate payments, process subscriptions, and handle disputes. CCBill may collect additional information as required for fraud prevention, compliance, and regulatory purposes.</li>
  <li><strong>Cloud Hosting and Infrastructure:</strong> DigitalOcean provides cloud hosting services for our Platform. Your data is stored on DigitalOcean's servers, which are located in data centers around the world. DigitalOcean does not access your personal information except as necessary to provide infrastructure services.</li>
  <li><strong>Analytics Services:</strong> We use Fathom Analytics for privacy-respecting website analytics. Fathom collects only aggregated, anonymized usage statistics and does not track individual users or collect personal information.</li>
  <li><strong>Identity Verification Services:</strong> We share identification documents and verification photos with third-party identity verification providers to confirm your age and identity.</li>
  <li><strong>Customer Support Tools:</strong> We may use third-party tools to manage customer support tickets and communications.</li>
  <li><strong>Email and Communication Services:</strong> We use email service providers to send transactional and marketing emails.</li>
  <li><strong>Content Delivery Networks (CDNs):</strong> We use CDNs to deliver content quickly and efficiently to users around the world.</li>
</ul>
<p>All service providers are contractually obligated to protect your information, use it only for the purposes we specify, and comply with applicable data protection laws.</p>

<h3>3. Business Transfers</h3>
<p>If {{company_name}} is involved in a merger, acquisition, bankruptcy, dissolution, reorganization, asset sale, or similar transaction, your personal information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on the Platform of any change in ownership or use of your personal information, as well as any choices you may have regarding your information.</p>

<h3>4. Legal Requirements and Safety</h3>
<p>We may disclose your information if required to do so by law or if we believe in good faith that such disclosure is necessary to:</p>
<ul>
  <li>Comply with legal obligations, court orders, or legal processes</li>
  <li>Respond to lawful requests from government authorities, law enforcement, or regulatory agencies</li>
  <li>Enforce our Terms of Service, Community Guidelines, and other policies</li>
  <li>Protect the rights, property, or safety of {{site_name}}, our users, or the public</li>
  <li>Detect, prevent, or investigate fraud, security breaches, or illegal activity</li>
  <li>Report child sexual abuse material (CSAM) to NCMEC and law enforcement as required by law</li>
</ul>

<h3>5. With Your Consent</h3>
<p>We may share your information with third parties when you give us explicit consent to do so, such as when you authorize a third-party application to access your account.</p>

<h3>6. Aggregated and De-identified Information</h3>
<p>We may share aggregated, anonymized, or de-identified information that cannot reasonably be used to identify you. This information may be used for research, analytics, marketing, or other purposes and may be shared publicly or with third parties.</p>

<h2>Your Rights and Choices</h2>
<p>You have certain rights and choices regarding your personal information, depending on your location and applicable laws.</p>

<h3>Account Information and Settings</h3>
<ul>
  <li><strong>Access and Update:</strong> You can access and update your account information, profile details, and preferences at any time through your account settings</li>
  <li><strong>Privacy Settings:</strong> You can control who can view your profile, content, and activity through your privacy settings</li>
  <li><strong>Communication Preferences:</strong> You can manage your email notification preferences and opt out of marketing communications through your account settings or by clicking "unsubscribe" in emails</li>
</ul>

<h3>Rights Under GDPR (EEA, UK, Switzerland)</h3>
<p>If you are located in the EEA, UK, or Switzerland, you have the following rights under the General Data Protection Regulation (GDPR):</p>
<ul>
  <li><strong>Right of Access:</strong> Request a copy of the personal information we hold about you</li>
  <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal information</li>
  <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your personal information in certain circumstances</li>
  <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your personal information in certain circumstances</li>
  <li><strong>Right to Data Portability:</strong> Request a copy of your personal information in a structured, commonly used, machine-readable format</li>
  <li><strong>Right to Object:</strong> Object to our processing of your personal information for direct marketing, legitimate interests, or research purposes</li>
  <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for processing activities that rely on consent (this will not affect the lawfulness of processing based on consent before withdrawal)</li>
  <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority if you believe we have violated your privacy rights</li>
</ul>

<h3>Rights Under CCPA/CPRA (California Residents)</h3>
<p>If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
<ul>
  <li><strong>Right to Know:</strong> Request information about the categories and specific pieces of personal information we collect, use, disclose, and sell (we do not sell personal information)</li>
  <li><strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions</li>
  <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
  <li><strong>Right to Opt-Out of Sale/Sharing:</strong> Opt out of the "sale" or "sharing" of your personal information (we do not sell personal information, but you can opt out of targeted advertising)</li>
  <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> Limit our use of your sensitive personal information to what is necessary to provide our services</li>
  <li><strong>Right to Non-Discrimination:</strong> Receive equal service and pricing even if you exercise your privacy rights (we will not discriminate against you for exercising your rights)</li>
</ul>

<h3>Rights Under Other Laws</h3>
<p>Depending on your location, you may have additional privacy rights under local laws. We will honor these rights in accordance with applicable legal requirements. Please contact us at {{privacy_email}} to learn more about your rights in your jurisdiction.</p>

<h3>Exercising Your Rights</h3>
<p>To exercise any of these rights, please contact us at {{privacy_email}} with the subject line "Privacy Rights Request." Please include:</p>
<ul>
  <li>Your full name and username</li>
  <li>The email address associated with your account</li>
  <li>A description of the right you wish to exercise</li>
  <li>Any specific information you are requesting or actions you want us to take</li>
</ul>
<p>We will verify your identity before processing your request to protect your privacy and security. We will respond to verified requests within the timeframes required by applicable law (typically 30-45 days). In some cases, we may need to retain certain information for legal or legitimate business purposes, even after you request deletion.</p>

<h2>Data Retention</h2>
<p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.</p>

<h3>Retention Periods</h3>
<ul>
  <li><strong>Account Information:</strong> We retain your account information for as long as your account is active or as needed to provide our services</li>
  <li><strong>Identity Verification Records:</strong> We retain identity verification documents and related information for as long as required by applicable laws, regulations, and compliance obligations (typically 5-7 years after account closure)</li>
  <li><strong>Payment and Financial Records:</strong> We retain transaction records, payment information, and financial data for as long as required for tax, accounting, and legal compliance purposes (typically 7-10 years)</li>
  <li><strong>Content:</strong> User-generated content is retained for as long as your account is active and for a period after deletion to ensure proper content removal and prevent unauthorized redistribution</li>
  <li><strong>Communications:</strong> Messages, comments, and other communications are retained for as long as your account is active or until you delete them</li>
  <li><strong>Usage and Log Data:</strong> Automatically collected information, logs, and analytics data are typically retained for 1-3 years for security, fraud prevention, and platform improvement purposes</li>
  <li><strong>Legal and Safety Records:</strong> Information related to violations of our policies, disputes, legal matters, or safety concerns may be retained indefinitely as necessary to protect our legal interests and ensure platform safety</li>
</ul>

<h3>Account Deletion</h3>
<p>You can request deletion of your account at any time through your account settings or by contacting {{support_email}}. When you delete your account:</p>
<ul>
  <li>Your profile, content, and publicly visible information will be removed from the Platform</li>
  <li>We will delete or anonymize your personal information, except where retention is required by law or legitimate business interests</li>
  <li>Some information may remain in backups and archives for a limited period before permanent deletion</li>
  <li>Information related to financial transactions, legal compliance, or safety concerns may be retained as described above</li>
  <li>Information that has been shared with or made available to other users (such as messages you sent) may remain visible to those users</li>
</ul>

<h2>Data Security</h2>
<p>We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. Our security measures include:</p>
<ul>
  <li><strong>Encryption:</strong> We use HTTPS/TLS encryption to protect data in transit and encrypt sensitive data at rest, including passwords and payment information</li>
  <li><strong>Access Controls:</strong> We restrict access to personal information to employees, contractors, and service providers who need access to perform their job functions, all of whom are bound by confidentiality obligations</li>
  <li><strong>Secure Infrastructure:</strong> We use secure cloud hosting infrastructure with multiple layers of security, including firewalls, intrusion detection, and DDoS protection</li>
  <li><strong>Authentication:</strong> We use secure authentication mechanisms and offer two-factor authentication (2FA) to protect account access</li>
  <li><strong>Monitoring and Logging:</strong> We monitor our systems for suspicious activity and maintain logs to detect and respond to security incidents</li>
  <li><strong>Regular Security Assessments:</strong> We conduct regular security audits, vulnerability assessments, and penetration testing</li>
  <li><strong>Incident Response:</strong> We maintain an incident response plan to quickly address any security breaches or data incidents</li>
</ul>
<p>While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed to protecting your information to the best of our ability. If we become aware of a data breach that affects your personal information, we will notify you in accordance with applicable legal requirements.</p>

<h2>International Data Transfers</h2>
<p>{{site_name}} operates globally and may transfer, store, and process your personal information in countries other than your country of residence, including the United States. These countries may have different data protection laws than your country.</p>
<p>When we transfer personal information from the EEA, UK, or Switzerland to other countries, we implement appropriate safeguards to protect your information, including:</p>
<ul>
  <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
  <li>Data processing agreements with service providers that include appropriate data protection terms</li>
  <li>Adequacy decisions by the European Commission recognizing certain countries as providing adequate data protection</li>
  <li>Other legally recognized transfer mechanisms as appropriate</li>
</ul>
<p>By using {{site_name}}, you consent to the transfer of your information to countries outside your jurisdiction, including countries that may not provide the same level of data protection as your home country.</p>

<h2>Children's Privacy</h2>
<p>{{site_name}} is an adult platform intended only for users who are 18 years of age or older. We do not knowingly collect, use, or share personal information from individuals under 18 years of age. If you are under 18, you must not use our Platform or services.</p>
<p>If we become aware that we have collected personal information from a person under 18, we will take immediate steps to delete that information and terminate the associated account. If you believe we have collected information from someone under 18, please contact us immediately at {{legal_email}}.</p>

<h2>Third-Party Links and Services</h2>
<p>Our Platform may contain links to third-party websites, services, or applications that are not operated by us. This Privacy Policy does not apply to third-party websites or services. We are not responsible for the privacy practices of third parties, and we encourage you to review the privacy policies of any third-party sites or services you visit or use.</p>
<p>If you connect your {{site_name}} account to third-party services (such as social media platforms), those services may collect information about you and your use of our Platform in accordance with their own privacy policies.</p>

<h2>Do Not Track Signals</h2>
<p>Some web browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want to have your online activity tracked. Our Platform does not currently respond to DNT signals or similar mechanisms. However, you can control cookies and tracking through your browser settings and our cookie preference tools. For more information, please see our <a href="{{website_url}}/legal/cookie-policy">Cookie Policy</a>.</p>

<h2>Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or business operations. When we make material changes to this policy, we will notify you by:</p>
<ul>
  <li>Updating the "Effective Date" at the top of this policy</li>
  <li>Displaying a prominent notice on the Platform</li>
  <li>Sending you an email notification (if you have provided us with your email address)</li>
</ul>
<p>We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information. Your continued use of {{site_name}} after changes to this policy constitutes your acceptance of the updated terms.</p>
<p>If you do not agree with the changes, you should stop using the Platform and may request deletion of your account and personal information.</p>

<h2>Contact Us</h2>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:</p>
<p>
  <strong>{{company_name}}</strong><br />
  Privacy Team<br />
  Email: {{privacy_email}}<br /><br />
  Legal Inquiries: {{legal_email}}<br />
  General Support: {{support_email}}<br />
</p>
<p>We will respond to your inquiry within a reasonable timeframe, typically within 30 days for general inquiries and within the timeframes required by applicable law for data protection rights requests.</p>

<h2>Additional Information for Specific Jurisdictions</h2>

<h3>European Economic Area, United Kingdom, and Switzerland</h3>
<p>If you are located in the EEA, UK, or Switzerland, the data controller responsible for your personal information is {{company_name}}. You have the right to lodge a complaint with your local supervisory authority if you believe we have violated your privacy rights under the GDPR or UK GDPR.</p>

<h3>California</h3>
<p>California residents have specific rights under the CCPA and CPRA as outlined in the "Your Rights and Choices" section above. We do not sell personal information as defined by California law. In the past 12 months, we have disclosed personal information to service providers for business purposes as described in the "How We Share Your Information" section.</p>

<h3>Other Jurisdictions</h3>
<p>If you are located in other jurisdictions with specific data protection laws, we will comply with applicable legal requirements. Please contact us at {{privacy_email}} for more information about how we handle your personal information in your specific jurisdiction.</p>

<h2>Payment Processing Information</h2>

<h3>CCBill Payment Processing</h3>
<p>All payment transactions on {{site_name}} are processed by CCBill, a third-party payment processor. When you make a purchase or subscription payment, you will be directed to CCBill's secure payment pages. CCBill collects and processes your payment information directly and does not share your complete payment card details with us.</p>
<p><strong>Information CCBill Collects:</strong></p>
<ul>
  <li>Payment card information (credit/debit card number, expiration date, CVV)</li>
  <li>Billing name and address</li>
  <li>Email address</li>
  <li>Transaction details</li>
  <li>Device and browser information for fraud prevention</li>
  <li>Any other information required to process payments and comply with financial regulations</li>
</ul>
<p><strong>How CCBill Uses Your Information:</strong></p>
<ul>
  <li>To process payments and subscriptions</li>
  <li>To prevent fraud and ensure transaction security</li>
  <li>To comply with payment card industry (PCI) standards and financial regulations</li>
  <li>To handle billing disputes, chargebacks, and refunds</li>
  <li>To send transaction confirmations and receipts</li>
</ul>
<p>CCBill operates under its own privacy policy, which governs how they collect, use, and protect your payment information. We encourage you to review CCBill's privacy policy at <a href="https://www.ccbill.com/privacy-policy" target="_blank">https://www.ccbill.com/privacy-policy</a>.</p>
<p>We receive limited transaction information from CCBill, such as transaction confirmation, subscriber identification, subscription status, and transaction amounts, but we do not receive or store your complete payment card details. This information sharing is necessary to provide our services, manage subscriptions, process creator payouts, and handle customer support inquiries.</p>

<h2>Creator-Specific Privacy Information</h2>

<h3>Additional Data Collection for Creators</h3>
<p>Content creators provide additional information for identity verification, payment processing, and tax compliance purposes. This information is treated with heightened security and is used solely for verification, payment, compliance, and safety purposes.</p>

<h3>Earnings and Financial Information</h3>
<p>We collect and retain detailed financial information about your creator earnings, including:</p>
<ul>
  <li>Subscription revenue and individual transaction amounts</li>
  <li>Tips and custom content purchases</li>
  <li>Refunds and chargebacks</li>
  <li>Payout history and schedules</li>
  <li>Tax withholding and reporting information</li>
</ul>
<p>This information is necessary to process payments, comply with tax laws, and provide you with financial reporting and analytics about your account.</p>

<h3>Subscriber Information Visible to Creators</h3>
<p>As a creator, you can see certain information about your subscribers, including:</p>
<ul>
  <li>Username and display name</li>
  <li>Profile photo and bio (if public)</li>
  <li>Subscription status and subscription date</li>
  <li>Purchase history (content purchased, tips sent)</li>
  <li>Messages and interactions with you</li>
</ul>
<p>You must not misuse subscriber information, share it with third parties without consent, or use it for purposes outside of providing your content and services on {{site_name}}.</p>

<h2>Your Responsibilities</h2>
<p>You are responsible for:</p>
<ul>
  <li>Maintaining the confidentiality of your account credentials</li>
  <li>Ensuring the accuracy of information you provide to us</li>
  <li>Notifying us of any unauthorized access to your account</li>
  <li>Complying with this Privacy Policy and our other policies</li>
  <li>Respecting the privacy of other users</li>
  <li>Obtaining necessary consents before sharing others' personal information</li>
</ul>

<h2>Policy Interpretation</h2>
<p>This Privacy Policy should be read in conjunction with our <a href="{{website_url}}/legal/terms-of-service">Terms of Service</a>, <a href="{{website_url}}/legal/community-guidelines">Community Guidelines</a>, <a href="{{website_url}}/legal/cookie-policy">Cookie Policy</a>, and other policies. In the event of any conflict between this Privacy Policy and other policies, this Privacy Policy shall prevail with respect to privacy matters.</p>

<h2>Effective Date and Acceptance</h2>
<p>This Privacy Policy is effective as of the date stated at the top of this document. By creating an account, accessing, or using {{site_name}}, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.</p>
HTML,
                'description' => 'Privacy Policy content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],
            [
                'key' => 'terms_content',
                'value' => <<<'HTML'
<h1>Terms of Service</h1>
<p><strong>Effective Date:</strong> {{effective_date}}</p>
<p>Welcome to {{site_name}}. These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you and {{company_name}} ("we," "us," "our," or "{{site_name}}") governing your access to and use of the {{site_name}} platform, including our website at {{website_url}}, mobile applications, and any related services (collectively, the "Platform" or "Services").</p>
<p><strong>PLEASE READ THESE TERMS CAREFULLY BEFORE USING OUR PLATFORM. BY CREATING AN ACCOUNT, ACCESSING, OR USING {{site_name}}, YOU AGREE TO BE BOUND BY THESE TERMS AND ALL POLICIES INCORPORATED BY REFERENCE. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE PLATFORM.</strong></p>

<h2>1. Acceptance of Terms</h2>
<p>By creating an account, accessing, or using {{site_name}}, you acknowledge that you have read, understood, and agree to be bound by:</p>
<ul>
  <li>These Terms of Service</li>
  <li>Our <a href="{{website_url}}/legal/privacy-policy">Privacy Policy</a></li>
  <li>Our <a href="{{website_url}}/legal/community-guidelines">Community Guidelines</a></li>
  <li>Our <a href="{{website_url}}/legal/dmca-policy">DMCA Policy</a></li>
  <li>Our <a href="{{website_url}}/legal/cookie-policy">Cookie Policy</a></li>
  <li>Any additional terms, policies, or guidelines that may apply to specific features or services</li>
</ul>
<p>These Terms apply to all users of the Platform, including visitors, subscribers, content creators, and any other users who access or use the Services. If you are using the Platform on behalf of an organization or entity, you represent and warrant that you have the authority to bind that organization or entity to these Terms.</p>

<h2>2. Changes to Terms</h2>
<p>We reserve the right to modify, update, or replace these Terms at any time in our sole discretion. When we make material changes to these Terms, we will:</p>
<ul>
  <li>Update the "Effective Date" at the top of this document</li>
  <li>Display a prominent notice on the Platform</li>
  <li>Send you an email notification (if you have provided us with your email address)</li>
  <li>Require you to accept the updated Terms before continuing to use the Platform (for material changes)</li>
</ul>
<p>Your continued use of the Platform after changes to these Terms take effect constitutes your acceptance of the revised Terms. If you do not agree to the modified Terms, you must stop using the Platform and may terminate your account as described in Section 22 (Termination).</p>
<p>It is your responsibility to review these Terms periodically. We recommend checking this page regularly to stay informed of any changes.</p>

<h2>3. Eligibility and Age Requirements</h2>

<h3>3.1 Age Requirement</h3>
<p>{{site_name}} is an adult entertainment platform featuring sexually explicit content. You must be at least 18 years of age to access or use the Platform in any capacity. By using {{site_name}}, you represent and warrant that:</p>
<ul>
  <li>You are at least 18 years old (or the age of majority in your jurisdiction, whichever is greater)</li>
  <li>You have the legal right to access adult content in your jurisdiction</li>
  <li>You will not allow any person under 18 years of age to access your account or view content through your account</li>
  <li>Accessing adult content is legal in your jurisdiction</li>
</ul>
<p>We reserve the right to request proof of age at any time. If we discover that you are under 18 years of age, we will immediately terminate your account and may report the matter to appropriate authorities.</p>

<h3>3.2 Identity Verification for Content Creators</h3>
<p>All users who wish to create, upload, or share content on {{site_name}} must complete our mandatory identity verification process before they can create or monetize content. This process requires you to:</p>
<ul>
  <li>Provide a valid government-issued photo identification document (passport, driver's license, national ID card)</li>
  <li>Submit selfie photos or videos for facial recognition comparison</li>
  <li>Verify your legal name, date of birth, and other identifying information</li>
  <li>Provide additional documentation as requested to confirm your identity and eligibility</li>
</ul>
<p>By submitting identification documents, you represent and warrant that:</p>
<ul>
  <li>All information and documents you provide are accurate, current, and authentic</li>
  <li>You are the person depicted in the identification documents</li>
  <li>You have not altered, falsified, or manipulated any documents</li>
  <li>You consent to our verification of your identity with third-party verification services</li>
</ul>
<p>We reserve the right to reject any verification submission, request additional documentation, require re-verification at any time, or terminate accounts that fail to complete or maintain valid verification. Attempting to circumvent, falsify, or manipulate the verification process is grounds for immediate permanent account termination and may be reported to law enforcement.</p>

<h3>3.3 Additional Eligibility Requirements</h3>
<p>In addition to age requirements, you represent and warrant that:</p>
<ul>
  <li>You have the legal capacity to enter into these Terms</li>
  <li>You are not prohibited from using the Platform by any applicable law</li>
  <li>Your use of the Platform does not violate any applicable law or regulation</li>
  <li>You have not been previously banned or suspended from {{site_name}} or created an account to evade such ban or suspension</li>
  <li>You are not listed on any government watch list or subject to economic sanctions</li>
</ul>

<h2>4. Account Registration and Security</h2>

<h3>4.1 Account Creation</h3>
<p>To access certain features of the Platform, you must create an account by providing:</p>
<ul>
  <li>A valid email address</li>
  <li>A unique username</li>
  <li>A secure password</li>
  <li>Your date of birth</li>
  <li>Any other information required during the registration process</li>
</ul>
<p>You agree to provide accurate, current, and complete information during registration and to update your information to maintain its accuracy. Providing false or misleading information may result in account suspension or termination.</p>

<h3>4.2 Account Security</h3>
<p>You are solely responsible for maintaining the confidentiality and security of your account credentials (username and password) and for all activities that occur under your account. You agree to:</p>
<ul>
  <li>Use a strong, unique password for your account</li>
  <li>Not share your password or account access with any other person</li>
  <li>Not allow anyone else to use your account</li>
  <li>Notify us immediately at {{support_email}} if you suspect unauthorized access to your account</li>
  <li>Log out of your account after each session, especially when using shared or public devices</li>
  <li>Enable two-factor authentication (2FA) when available for enhanced security</li>
</ul>
<p>You are liable for all activities conducted through your account, whether or not you authorized such activities. We are not liable for any loss or damage arising from your failure to maintain account security or from unauthorized account access.</p>

<h3>4.3 Account Restrictions</h3>
<p>You may only create one account unless explicitly authorized by us to create additional accounts. Creating multiple accounts to evade bans, circumvent restrictions, manipulate metrics, or engage in fraudulent activity is prohibited and will result in termination of all associated accounts.</p>

<h2>5. User Content and Ownership</h2>

<h3>5.1 Your Content</h3>
<p>"User Content" means any content you create, upload, post, share, transmit, or otherwise make available through the Platform, including but not limited to:</p>
<ul>
  <li>Photos, videos, audio recordings, and other media files</li>
  <li>Text posts, captions, descriptions, and comments</li>
  <li>Messages and communications</li>
  <li>Live streams and broadcasts</li>
  <li>Profile information, bios, and usernames</li>
  <li>Any other content you contribute to the Platform</li>
</ul>

<h3>5.2 Ownership of Your Content</h3>
<p>You retain all ownership rights to your User Content. By uploading User Content to {{site_name}}, you do not transfer ownership of your content to us. However, you do grant us certain licenses to use your content as described in Section 5.3 below.</p>

<h3>5.3 License Grant to {{site_name}}</h3>
<p>By uploading, posting, or otherwise making User Content available on the Platform, you grant {{site_name}} a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, perform, and otherwise exploit your User Content in connection with operating, providing, promoting, and improving the Platform and our business, including but not limited to:</p>
<ul>
  <li>Storing, hosting, and transmitting your User Content on our servers and through our network</li>
  <li>Making your User Content available to other users in accordance with your account settings and privacy preferences</li>
  <li>Displaying your User Content to subscribers who have purchased access or subscriptions</li>
  <li>Creating thumbnails, previews, and reformatted versions of your User Content for display and distribution</li>
  <li>Using your username, profile photo, and public content for promotional and marketing purposes</li>
  <li>Analyzing your User Content to improve our services, develop new features, and ensure platform security</li>
</ul>
<p>This license continues for a commercially reasonable period after you delete your content or terminate your account to allow for content removal from backups, caches, and distribution networks. The license for content that has been shared with or made available to other users may continue to the extent necessary to allow those users to access content they have lawfully obtained.</p>

<h3>5.4 Responsibilities for Your Content</h3>
<p>You are solely responsible for your User Content and the consequences of posting it. By uploading User Content, you represent and warrant that:</p>
<ul>
  <li>You own all rights to the content or have obtained all necessary licenses, permissions, and consents</li>
  <li>Your content does not infringe or violate any third party's intellectual property rights, privacy rights, publicity rights, or other legal rights</li>
  <li>Your content complies with these Terms, our Community Guidelines, and all applicable laws</li>
  <li>All individuals appearing in your content are at least 18 years of age</li>
  <li>You have obtained explicit consent from all individuals appearing in your content to be filmed, photographed, and have their likeness shared on {{site_name}}</li>
  <li>You maintain documentation proving consent and age verification for all individuals appearing in your content (model releases, signed consent forms, copies of government IDs)</li>
  <li>Your content does not contain viruses, malware, or malicious code</li>
</ul>

<h3>5.5 Content Monitoring and Moderation</h3>
<p>We reserve the right, but have no obligation, to monitor, review, or moderate User Content. We may remove, disable access to, or modify any User Content at any time, with or without notice, for any reason or no reason, including if we determine that the content:</p>
<ul>
  <li>Violates these Terms or our Community Guidelines</li>
  <li>Infringes intellectual property or other legal rights</li>
  <li>Poses a safety or security risk</li>
  <li>Could create liability for {{site_name}}</li>
  <li>Is harmful, offensive, or inappropriate</li>
</ul>
<p>Content removal does not constitute an admission of liability, and we have no obligation to notify you before removing content, though we will typically do so when practical.</p>

<h3>5.6 Backup and Content Loss</h3>
<p>While we implement regular backup procedures, we are not responsible for any loss, corruption, or damage to your User Content. You are solely responsible for maintaining your own backup copies of your content. We strongly recommend that you keep copies of all content you upload to {{site_name}} on your own devices or storage systems.</p>

<h2>6. Content Creator Terms</h2>

<h3>6.1 Creator Eligibility and Verification</h3>
<p>To become a content creator on {{site_name}}, you must:</p>
<ul>
  <li>Be at least 18 years of age</li>
  <li>Complete our mandatory identity verification process</li>
  <li>Provide accurate payment and tax information for receiving payouts</li>
  <li>Agree to these Terms and all applicable creator-specific policies</li>
  <li>Comply with all applicable laws in your jurisdiction</li>
</ul>

<h3>6.2 Content Requirements and Restrictions</h3>
<p>All content you create and share must comply with our Community Guidelines and applicable laws. You are prohibited from creating, uploading, or sharing content that:</p>
<ul>
  <li>Depicts anyone under 18 years of age</li>
  <li>Was created without the consent of all individuals depicted</li>
  <li>Violates any person's privacy, publicity, or other rights</li>
  <li>Infringes on any intellectual property rights</li>
  <li>Contains illegal, violent, or harmful content</li>
  <li>Violates any provision of our Community Guidelines</li>
</ul>
<p>You must maintain proper documentation (model releases, consent forms, age verification records) for all individuals appearing in your content for as long as the content is available on the Platform and for a reasonable period thereafter as required by law.</p>

<h3>6.3 Accurate Representation</h3>
<p>You must accurately represent your content, pricing, and subscription offerings. You may not:</p>
<ul>
  <li>Use misleading titles, descriptions, or preview images</li>
  <li>Promise content that you do not intend to deliver</li>
  <li>Engage in bait-and-switch tactics</li>
  <li>Misrepresent your identity or affiliation with others</li>
  <li>Make false claims about your content or services</li>
</ul>

<h3>6.4 Prohibited Creator Conduct</h3>
<p>As a content creator, you may not:</p>
<ul>
  <li>Direct subscribers to conduct transactions outside of {{site_name}} to avoid platform fees</li>
  <li>Share payment information or personal contact details with subscribers for the purpose of off-platform transactions</li>
  <li>Use {{site_name}} solely as an advertisement or redirect to other platforms without providing content on our Platform</li>
  <li>Manipulate or game the platform's algorithms, metrics, or ranking systems</li>
  <li>Engage in vote manipulation, fake engagement, or purchase fake followers/subscribers</li>
  <li>Harass, threaten, or abuse subscribers or other users</li>
  <li>Share or redistribute other creators' content without authorization</li>
  <li>Engage in any conduct that violates these Terms or our Community Guidelines</li>
</ul>

<h2>7. Subscriber Terms</h2>

<h3>7.1 Access to Content</h3>
<p>As a subscriber, you may access content from creators you subscribe to or purchase content from in accordance with the terms and pricing set by those creators. Your access is subject to:</p>
<ul>
  <li>Maintaining an active subscription or having made the required purchase</li>
  <li>The creator maintaining their account and not removing or restricting access to content</li>
  <li>Your compliance with these Terms and our Community Guidelines</li>
  <li>Successful payment processing</li>
</ul>

<h3>7.2 Restrictions on Content Use</h3>
<p>Content you access through subscriptions or purchases is licensed to you for personal, non-commercial use only. You may not:</p>
<ul>
  <li>Download, record, screenshot, capture, copy, reproduce, or store content (except through features explicitly provided by the Platform for offline viewing)</li>
  <li>Distribute, share, sell, rent, lease, or otherwise transfer content to any third party</li>
  <li>Post or republish content on other websites, platforms, or forums</li>
  <li>Use content for any commercial purpose</li>
  <li>Create derivative works from the content</li>
  <li>Remove or circumvent watermarks, DRM, or other technological protection measures</li>
  <li>Share account credentials to allow others to access content</li>
</ul>
<p>Violation of these restrictions may result in account termination, legal action, and liability for damages, including statutory damages under applicable copyright laws.</p>

<h3>7.3 Subscriber Conduct</h3>
<p>As a subscriber, you agree to:</p>
<ul>
  <li>Treat content creators with respect and courtesy</li>
  <li>Not harass, threaten, stalk, or abuse creators or other users</li>
  <li>Not send unsolicited sexual or inappropriate messages</li>
  <li>Respect creators' boundaries, prices, and content offerings</li>
  <li>Not attempt to manipulate or coerce creators</li>
  <li>Not share creators' personal information without consent</li>
  <li>Use the messaging system responsibly and not for spam or prohibited conduct</li>
</ul>

<h2>8. Payment Terms</h2>

<h3>8.1 Pricing and Fees</h3>
<p>Content creators set their own pricing for subscriptions, individual content purchases, tips, and custom content requests. All prices are displayed in U.S. dollars (USD) unless otherwise specified. Prices are subject to change by creators at any time, though changes to subscription prices typically apply to new subscriptions or renewal periods.</p>
<p>{{site_name}} charges a platform fee of {{platform_fee_percentage}}% on all transactions processed through the Platform. This fee is deducted from the gross transaction amount before payouts to creators. Additional fees may apply for payment processing, currency conversion, or expedited payouts.</p>

<h3>8.2 Payment Processing</h3>
<p>All payments are processed by CCBill, our third-party payment processor. When you make a purchase or subscription payment, you will be directed to CCBill's secure payment pages. By making a payment, you agree to CCBill's terms of service and privacy policy.</p>
<p>You authorize us and CCBill to charge your designated payment method for all subscriptions, purchases, and fees incurred through your account. You represent and warrant that:</p>
<ul>
  <li>You have the legal right to use the payment method you provide</li>
  <li>The payment information you provide is accurate and current</li>
  <li>You will maintain sufficient funds or credit to cover all charges</li>
  <li>You are authorized to use the payment method for adult content purchases</li>
</ul>

<h3>8.3 Subscriptions</h3>
<p>Subscriptions are recurring payments that provide ongoing access to a creator's content. When you subscribe to a creator:</p>
<ul>
  <li>You will be charged the subscription price immediately upon subscribing</li>
  <li>Your subscription will automatically renew at the end of each billing cycle (monthly, quarterly, or annually as selected)</li>
  <li>Your payment method will be charged automatically on each renewal date</li>
  <li>You can cancel your subscription at any time through your account settings</li>
  <li>Cancellation takes effect at the end of the current billing period</li>
  <li>No refunds or credits are provided for partial subscription periods</li>
  <li>You retain access to content through the end of the paid subscription period after cancellation</li>
</ul>

<h3>8.4 One-Time Purchases</h3>
<p>One-time purchases (individual content items, tips, custom content) are charged immediately and are non-refundable except as required by law or as described in Section 8.6 (Refunds and Disputes).</p>

<h3>8.5 Taxes</h3>
<p>You are responsible for all applicable taxes, duties, and government fees associated with your use of the Platform. Prices displayed on the Platform may not include applicable taxes. Depending on your location, taxes (such as VAT, GST, or sales tax) may be added to your purchase at checkout.</p>
<p>Content creators are responsible for all taxes on their earnings, including income tax, self-employment tax, and any other applicable taxes. {{site_name}} may be required to collect tax information from creators and report earnings to tax authorities as required by law.</p>

<h3>8.6 Refunds and Disputes</h3>
<p>Due to the nature of digital content and our terms allowing immediate access upon purchase, all sales are generally final and non-refundable. However, we may provide refunds in the following limited circumstances:</p>
<ul>
  <li>Technical errors that prevent access to purchased content</li>
  <li>Unauthorized charges made to your account due to account compromise (reported within {{refund_dispute_window}} hours)</li>
  <li>Significant discrepancies between content advertised and content delivered</li>
  <li>Other circumstances at our sole discretion</li>
</ul>
<p>To request a refund, contact {{support_email}} within {{refund_dispute_window}} hours of the charge with a detailed explanation. We will investigate and respond within {{refund_response_time}} business days. Refund decisions are final and at our sole discretion.</p>

<h3>8.7 Chargebacks</h3>
<p>Initiating a chargeback or payment dispute with your financial institution without first contacting us to resolve the issue is a violation of these Terms. Fraudulent chargebacks may result in:</p>
<ul>
  <li>Immediate account suspension or termination</li>
  <li>Loss of access to all purchased content</li>
  <li>Collection of the disputed amount plus administrative fees</li>
  <li>Legal action to recover amounts owed</li>
  <li>Reporting to fraud prevention services</li>
</ul>
<p>If you believe there is an error or unauthorized charge, contact {{support_email}} before initiating a chargeback.</p>

<h3>8.8 Failed Payments</h3>
<p>If a payment fails due to insufficient funds, expired payment method, or other reasons:</p>
<ul>
  <li>Your subscription or access may be suspended or terminated</li>
  <li>We may attempt to process the payment again</li>
  <li>You may incur late fees or collection costs</li>
  <li>Your account may be restricted until the outstanding balance is paid</li>
</ul>
<p>You are responsible for updating your payment information to maintain uninterrupted service.</p>

<h2>9. Creator Payouts and Earnings</h2>

<h3>9.1 Earning Money as a Creator</h3>
<p>Content creators earn money on {{site_name}} through:</p>
<ul>
  <li>Subscription fees from subscribers</li>
  <li>Individual content purchases</li>
  <li>Tips and donations</li>
  <li>Custom content requests</li>
  <li>Live stream tips and gifts</li>
  <li>Any other monetization features offered on the Platform</li>
</ul>
<p>After deducting the platform fee ({{platform_fee_percentage}}%) and any applicable transaction fees, the remaining amount is your net earnings available for payout.</p>

<h3>9.2 Payout Schedule and Minimum Thresholds</h3>
<p>Payouts are processed on a {{payout_schedule}} schedule. To receive a payout, you must:</p>
<ul>
  <li>Have completed identity verification</li>
  <li>Have provided accurate payment information (bank account or other payout method)</li>
  <li>Have a minimum balance of {{minimum_payout_amount}} in your account</li>
  <li>Be in good standing with no pending disputes, investigations, or policy violations</li>
  <li>Comply with all payout requirements and documentation requests</li>
</ul>
<p>If you do not meet the minimum payout threshold, your earnings will roll over to the next payout period until the threshold is met.</p>

<h3>9.3 Payout Methods and Fees</h3>
<p>We offer payout methods including bank transfer (ACH/wire), and other payment services as available. Payout processing may incur fees for:</p>
<ul>
  <li>International wire transfers</li>
  <li>Currency conversion</li>
  <li>Expedited payments</li>
  <li>Third-party payment service fees</li>
</ul>
<p>Payout fees will be disclosed before you select your payout method. You are responsible for all fees associated with receiving payouts.</p>

<h3>9.4 Payout Delays and Holds</h3>
<p>We may delay or hold payouts in the following circumstances:</p>
<ul>
  <li>Pending investigation of policy violations or fraudulent activity</li>
  <li>Excessive chargebacks or refund requests</li>
  <li>Disputes regarding content ownership or rights</li>
  <li>Failure to provide required tax information or documentation</li>
  <li>Account suspension or termination</li>
  <li>Compliance with legal requirements or court orders</li>
  <li>Outstanding amounts owed to {{site_name}}</li>
</ul>
<p>We will notify you of any payout holds and the reasons for the hold. Payouts will be released once the issue is resolved, though we may forfeit funds in cases of serious violations or illegal activity.</p>

<h3>9.5 Refunds and Chargebacks Impact</h3>
<p>Refunds and chargebacks are deducted from your earnings. If you have already received a payout for a transaction that is later refunded or charged back:</p>
<ul>
  <li>The refund/chargeback amount plus fees will be deducted from your future earnings</li>
  <li>If you do not have sufficient future earnings, you may owe the amount to {{site_name}}</li>
  <li>Excessive chargebacks may result in account suspension and withheld payouts</li>
  <li>You may be required to reimburse {{site_name}} for any losses resulting from fraudulent activity</li>
</ul>

<h3>9.6 Tax Obligations</h3>
<p>You are solely responsible for all taxes on your earnings. We may collect tax information from you and report your earnings to tax authorities as required by applicable law, including issuing Form 1099 (or equivalent) for creators who earn above statutory thresholds.</p>
<p>If you fail to provide required tax information, we may:</p>
<ul>
  <li>Suspend payouts until information is provided</li>
  <li>Withhold taxes from your earnings as required by law</li>
  <li>Terminate your creator account</li>
</ul>

<h2>10. Intellectual Property Rights</h2>

<h3>10.1 {{site_name}} Intellectual Property</h3>
<p>The Platform and all its content, features, and functionality (including but not limited to software, code, text, graphics, logos, button icons, images, audio clips, data compilations, and the overall look and feel) are owned by {{company_name}} or its licensors and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
<p>{{site_name}}, our logo, and all related names, logos, product and service names, designs, and slogans are trademarks of {{company_name}} or its affiliates or licensors. You may not use these marks without our prior written permission.</p>

<h3>10.2 Limited License to Use the Platform</h3>
<p>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Platform for your personal, non-commercial use (or commercial use if you are an approved content creator). This license does not include:</p>
<ul>
  <li>Any right to reproduce, distribute, modify, or create derivative works from the Platform</li>
  <li>Any right to reverse engineer, decompile, or disassemble the Platform</li>
  <li>Any right to access or use the Platform for competitive purposes</li>
  <li>Any right to frame, mirror, or link to the Platform without authorization</li>
</ul>

<h3>10.3 DMCA and Copyright Infringement</h3>
<p>We respect intellectual property rights and expect our users to do the same. We respond to valid notices of alleged copyright infringement in accordance with the Digital Millennium Copyright Act (DMCA).</p>
<p>If you believe your copyrighted work has been infringed on {{site_name}}, please refer to our <a href="{{website_url}}/legal/dmca-policy">DMCA Policy</a> for instructions on submitting a takedown notice.</p>
<p>We maintain a policy of terminating accounts of users who are repeat infringers of intellectual property rights.</p>

<h3>10.4 Content Creator Intellectual Property</h3>
<p>Content creators retain ownership of their User Content, subject to the license grant in Section 5.3. We do not claim ownership of creator content, and creators are free to share their content on other platforms unless they have entered into exclusive agreements.</p>

<h2>11. Third-Party Services and Links</h2>

<h3>11.1 Third-Party Services</h3>
<p>The Platform may integrate with or rely on third-party services, including but not limited to:</p>
<ul>
  <li>CCBill for payment processing</li>
  <li>Identity verification services</li>
  <li>Cloud hosting and infrastructure providers</li>
  <li>Analytics services</li>
  <li>Content delivery networks</li>
</ul>
<p>Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the actions, practices, or content of third-party services.</p>

<h3>11.2 Links to Third-Party Websites</h3>
<p>The Platform may contain links to third-party websites or services that are not owned or controlled by {{site_name}}. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites. We do not warrant the offerings of any third parties or their websites.</p>
<p>You acknowledge and agree that we are not responsible or liable, directly or indirectly, for any damage or loss caused by your use of third-party websites or services.</p>

<h2>12. Prohibited Activities</h2>
<p>In addition to the prohibitions outlined in our Community Guidelines, you agree not to:</p>
<ul>
  <li><strong>Violate Laws:</strong> Use the Platform in any manner that violates applicable local, state, national, or international law or regulation</li>
  <li><strong>Infringe Rights:</strong> Infringe on the intellectual property, privacy, publicity, or other legal rights of others</li>
  <li><strong>Harm Minors:</strong> Exploit, harm, or attempt to exploit or harm minors in any way</li>
  <li><strong>Impersonate:</strong> Impersonate or attempt to impersonate {{site_name}}, our employees, another user, or any other person or entity</li>
  <li><strong>Spam or Harass:</strong> Send unsolicited messages, spam, or engage in harassment, abuse, or threatening behavior</li>
  <li><strong>Fraudulent Activity:</strong> Engage in fraudulent transactions, money laundering, or other financial crimes</li>
  <li><strong>Circumvent Security:</strong> Attempt to bypass, disable, or interfere with security features of the Platform</li>
  <li><strong>Unauthorized Access:</strong> Attempt to gain unauthorized access to accounts, systems, or networks connected to the Platform</li>
  <li><strong>Scraping and Automation:</strong> Use bots, scrapers, crawlers, or automated tools to access or extract data from the Platform without authorization</li>
  <li><strong>Malware:</strong> Upload viruses, malware, trojan horses, or other malicious code</li>
  <li><strong>Interference:</strong> Interfere with or disrupt the Platform, servers, or networks connected to the Platform</li>
  <li><strong>Reverse Engineering:</strong> Reverse engineer, decompile, or disassemble any aspect of the Platform</li>
  <li><strong>Commercial Use:</strong> Use the Platform for commercial purposes without authorization (except as an approved content creator)</li>
  <li><strong>Data Collection:</strong> Collect user information without consent for purposes outside the Platform</li>
</ul>

<h2>13. Privacy and Data Protection</h2>
<p>Your privacy is important to us. Our collection, use, and sharing of your personal information is governed by our <a href="{{website_url}}/legal/privacy-policy">Privacy Policy</a>. By using the Platform, you consent to our privacy practices as described in the Privacy Policy.</p>
<p>You are responsible for maintaining the privacy and security of your account. We are not liable for any loss or damage resulting from unauthorized access to your account due to your failure to maintain account security.</p>

<h2>14. Disclaimers and Warranties</h2>

<h3>14.1 Platform Provided "As Is"</h3>
<p><strong>THE PLATFORM AND ALL CONTENT, SERVICES, AND FEATURES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, {{company_name}} DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, TITLE, QUIET ENJOYMENT, ACCURACY, AND INTEGRATION.</strong></p>

<h3>14.2 No Warranty for User Content</h3>
<p><strong>WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY, COMPLETENESS, LEGALITY, OR QUALITY OF ANY USER CONTENT. WE DO NOT ENDORSE, WARRANT, OR GUARANTEE ANY USER CONTENT, PRODUCT, SERVICE, OR OFFERING AVAILABLE THROUGH THE PLATFORM.</strong></p>

<h3>14.3 Service Availability</h3>
<p><strong>WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. WE DO NOT WARRANT THAT DEFECTS WILL BE CORRECTED OR THAT THE PLATFORM IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE MAKE NO WARRANTIES ABOUT THE RELIABILITY, AVAILABILITY, OR ABILITY TO ACCESS THE PLATFORM.</strong></p>

<h3>14.4 Third-Party Services</h3>
<p><strong>WE ARE NOT RESPONSIBLE FOR ANY THIRD-PARTY SERVICES, CONTENT, OR WEBSITES. YOUR USE OF THIRD-PARTY SERVICES IS AT YOUR OWN RISK AND SUBJECT TO THEIR TERMS AND POLICIES.</strong></p>

<h3>14.5 Creator Earnings</h3>
<p><strong>WE MAKE NO GUARANTEES ABOUT CREATOR EARNINGS OR SUCCESS ON THE PLATFORM. CREATOR EARNINGS DEPEND ON MANY FACTORS OUTSIDE OUR CONTROL, INCLUDING CONTENT QUALITY, AUDIENCE SIZE, PRICING, AND MARKET CONDITIONS.</strong></p>

<h3>14.6 Legal Compliance</h3>
<p><strong>YOU ARE SOLELY RESPONSIBLE FOR ENSURING YOUR USE OF THE PLATFORM COMPLIES WITH ALL APPLICABLE LAWS IN YOUR JURISDICTION. WE MAKE NO WARRANTIES THAT THE PLATFORM IS APPROPRIATE OR AVAILABLE FOR USE IN ANY PARTICULAR LOCATION.</strong></p>

<h2>15. Limitation of Liability</h2>

<h3>15.1 Exclusion of Damages</h3>
<p><strong>TO THE FULLEST EXTENT PERMITTED BY LAW, {{company_name}}, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</strong></p>

<h3>15.2 Cap on Liability</h3>
<p><strong>TO THE FULLEST EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM WILL NOT EXCEED THE GREATER OF (A) $100 USD OR (B) THE TOTAL AMOUNT YOU PAID TO {{site_name}} IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.</strong></p>

<h3>15.3 Basis of Bargain</h3>
<p><strong>THE LIMITATIONS OF LIABILITY SET FORTH IN THIS SECTION REFLECT THE ALLOCATION OF RISK BETWEEN THE PARTIES AND ARE A FUNDAMENTAL ELEMENT OF THE BASIS OF THE BARGAIN BETWEEN YOU AND {{site_name}}. THE PLATFORM WOULD NOT BE PROVIDED WITHOUT THESE LIMITATIONS.</strong></p>

<h3>15.4 Jurisdictional Limitations</h3>
<p>Some jurisdictions do not allow the exclusion or limitation of certain warranties or damages. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.</p>

<h2>16. Indemnification</h2>
<p>You agree to indemnify, defend, and hold harmless {{company_name}}, its affiliates, officers, directors, employees, agents, licensors, and service providers from and against any and all claims, liabilities, damages, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising out of or relating to:</p>
<ul>
  <li>Your use of or inability to use the Platform</li>
  <li>Your User Content, including any claims that your content infringes or violates any third party's intellectual property or other rights</li>
  <li>Your violation of these Terms or any applicable law or regulation</li>
  <li>Your violation of any rights of another person or entity</li>
  <li>Your negligence or willful misconduct</li>
  <li>Any claim that your content caused damage to a third party</li>
  <li>Unauthorized access to your account resulting from your failure to maintain account security</li>
</ul>
<p>We reserve the right to assume the exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate with our defense of such claim. You will not settle any claim covered by this section without our prior written consent.</p>

<h2>17. Dispute Resolution and Arbitration</h2>

<h3>17.1 Informal Resolution</h3>
<p>Before filing a claim, you agree to contact us at {{legal_email}} to attempt to resolve the dispute informally. We will attempt to resolve disputes in good faith. If we cannot resolve the dispute within sixty (60) days, either party may proceed with formal dispute resolution.</p>

<h3>17.2 Binding Arbitration</h3>
<p><strong>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.</strong></p>
<p>You and {{company_name}} agree that any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Platform (except as specified in Section 17.5 below) will be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, rather than in court.</p>
<p>The arbitration will be conducted by a single neutral arbitrator. The arbitrator's decision will be final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>

<h3>17.3 Arbitration Procedures</h3>
<ul>
  <li>The arbitration will take place in {{arbitration_location}}, unless the parties agree otherwise or the arbitrator determines another location is more appropriate</li>
  <li>The arbitration will be conducted in English</li>
  <li>Each party will bear its own costs and fees unless the arbitrator determines otherwise</li>
  <li>The arbitrator may award any relief that a court could award, including attorneys' fees when authorized by law</li>
  <li>The arbitration proceedings and award will be kept confidential except as required by law</li>
</ul>

<h3>17.4 Class Action Waiver</h3>
<p><strong>YOU AND {{company_name}} AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. ARBITRATIONS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT ON A CLASS-WIDE, CONSOLIDATED, OR REPRESENTATIVE BASIS.</strong></p>
<p>If a court determines that this class action waiver is unenforceable, then the arbitration agreement will be void as to such proceeding, and the dispute must be brought in court.</p>

<h3>17.5 Exceptions to Arbitration</h3>
<p>Notwithstanding the arbitration provision above, either party may bring an individual action in small claims court if the claim qualifies. Additionally, either party may seek injunctive or other equitable relief in court to prevent infringement or misappropriation of intellectual property rights.</p>

<h3>17.6 Opt-Out Right</h3>
<p>You have the right to opt out of this arbitration agreement. To opt out, you must send written notice to {{legal_email}} within thirty (30) days of first accepting these Terms. Your notice must include your name, username, email address, and a clear statement that you wish to opt out of the arbitration agreement. If you opt out, you may pursue claims in court subject to the governing law and venue provisions below.</p>

<h3>17.7 Governing Law and Venue</h3>
<p>These Terms and any dispute arising out of or relating to them or the Platform will be governed by the laws of the State of {{governing_law_state}}, United States, without regard to its conflict of law provisions.</p>
<p>For any disputes not subject to arbitration (including if you opt out), you agree to submit to the exclusive jurisdiction of the state and federal courts located in {{venue_location}}.</p>

<h2>18. Modifications to the Platform</h2>
<p>We reserve the right to modify, suspend, or discontinue the Platform or any feature, service, or content at any time with or without notice. We may also impose limits on certain features or restrict access to parts or all of the Platform.</p>
<p>We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Platform or any content or services.</p>

<h2>19. Termination</h2>

<h3>19.1 Termination by You</h3>
<p>You may terminate your account at any time by:</p>
<ul>
  <li>Accessing your account settings and following the account deletion process</li>
  <li>Contacting customer support at {{support_email}}</li>
</ul>
<p>Upon termination by you:</p>
<ul>
  <li>Your account will be closed and access terminated</li>
  <li>Your profile and content will be removed from public view (subject to retention policies)</li>
  <li>Active subscriptions will be canceled (no refunds for partial periods)</li>
  <li>Creator earnings may be paid out according to our payout schedule, subject to any holds or disputes</li>
  <li>Certain obligations in these Terms will survive termination as described in Section 22.4</li>
</ul>

<h3>19.2 Termination by {{site_name}}</h3>
<p>We may suspend or terminate your account and access to the Platform immediately, with or without notice, for any reason or no reason, including if:</p>
<ul>
  <li>You violate these Terms or any of our policies</li>
  <li>We suspect fraudulent, illegal, or harmful activity</li>
  <li>You create risk or legal liability for us</li>
  <li>Your account has been inactive for an extended period</li>
  <li>We are required to do so by law</li>
  <li>We are discontinuing the Platform or certain features</li>
</ul>

<h3>19.3 Effects of Termination</h3>
<p>Upon termination or suspension of your account:</p>
<ul>
  <li>Your right to access and use the Platform immediately ceases</li>
  <li>You will lose access to all content, data, and information associated with your account</li>
  <li>We may delete your account data in accordance with our data retention policies</li>
  <li>Outstanding balances owed to {{site_name}} become immediately due and payable</li>
  <li>For creators, we may withhold payouts pending investigation or resolution of violations</li>
  <li>We may retain certain information as required by law or for legitimate business purposes</li>
  <li>Content shared with or purchased by other users may remain accessible to those users</li>
</ul>

<h3>19.4 Survival</h3>
<p>The following sections survive termination of these Terms: Sections 5 (User Content and Ownership), 10 (Intellectual Property Rights), 14 (Disclaimers and Warranties), 15 (Limitation of Liability), 16 (Indemnification), 17 (Dispute Resolution and Arbitration), and this Section 19.4 (Survival), along with any other provisions that by their nature should survive termination.</p>

<h2>20. Copyright Agent</h2>
<p>Our designated agent for notice of alleged copyright infringement under the DMCA is:</p>
<p>
  <strong>{{site_name}}</strong><br />
  DMCA Agent<br />
  Email: {{dmca_email}}<br />
</p>
<p>For complete information about submitting DMCA notices and counter-notifications, please refer to our <a href="{{website_url}}/legal/dmca-policy">DMCA Policy</a>.</p>

<h2>21. General Provisions</h2>

<h3>21.1 Entire Agreement</h3>
<p>These Terms, together with the Privacy Policy, Community Guidelines, DMCA Policy, Cookie Policy, and any other policies or agreements referenced herein, constitute the entire agreement between you and {{company_name}} regarding your use of the Platform and supersede all prior or contemporaneous understandings and agreements.</p>

<h3>21.2 Severability</h3>
<p>If any provision of these Terms is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions will not be affected or impaired in any way. The invalid provision will be replaced with a valid provision that most closely reflects the intent of the original provision.</p>

<h3>21.3 Waiver</h3>
<p>Our failure to enforce any right or provision of these Terms will not constitute a waiver of such right or provision. Any waiver of any provision of these Terms will be effective only if in writing and signed by an authorized representative of {{company_name}}.</p>

<h3>21.4 Assignment</h3>
<p>You may not assign, transfer, or delegate these Terms or your rights and obligations hereunder without our prior written consent. We may assign these Terms, in whole or in part, at any time with or without notice to you. These Terms bind and inure to the benefit of the parties and their permitted successors and assigns.</p>

<h3>21.5 No Third-Party Beneficiaries</h3>
<p>These Terms do not and are not intended to confer any rights or remedies upon any person other than you and {{company_name}}.</p>

<h3>21.6 Force Majeure</h3>
<p>We will not be liable for any delay or failure to perform our obligations under these Terms due to causes beyond our reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.</p>

<h3>21.7 Electronic Communications</h3>
<p>By using the Platform, you consent to receive electronic communications from us. These communications may include notices about your account, transactional information, and promotional messages. You agree that all agreements, notices, disclosures, and other communications that we provide to you electronically satisfy any legal requirement that such communications be in writing.</p>
<p>You can opt out of promotional emails by clicking "unsubscribe" in any promotional email or by adjusting your notification settings. You cannot opt out of transactional or account-related communications.</p>

<h3>21.8 Export Controls</h3>
<p>You may not use, export, or re-export the Platform or any technology or software provided through the Platform except as authorized by United States law and the laws of the jurisdiction in which the Platform was obtained. You represent and warrant that you are not located in a country subject to a U.S. government embargo or designated as a "terrorist supporting" country, and that you are not on any U.S. government list of prohibited or restricted parties.</p>

<h3>21.9 Government Users</h3>
<p>If you are a U.S. government entity or using the Platform in a government capacity, the Platform is a "commercial item" as defined in 48 C.F.R. §2.101, and your use is subject to these Terms.</p>

<h3>21.10 Language</h3>
<p>These Terms are written in English. Any translations are provided for convenience only. In the event of any conflict between the English version and a translated version, the English version will control.</p>

<h3>21.11 Notices</h3>
<p>All notices to {{company_name}} must be sent to {{legal_email}} or to the mailing address specified in our contact information. Notices to you may be provided via email to the address associated with your account, by posting on the Platform, or by other legally permissible means.</p>

<h3>21.12 Relationship</h3>
<p>Nothing in these Terms creates any partnership, joint venture, employment, agency, or franchisee relationship between you and {{company_name}}. Content creators are independent contractors and not employees or agents of {{site_name}}.</p>

<h2>22. Contact Information</h2>
<p>If you have questions, concerns, or complaints about these Terms or the Platform, please contact us:</p>
<p>
  <strong>{{company_name}}</strong><br />
  Email: {{legal_email}}<br /><br />
  General Support: {{support_email}}<br />
  DMCA Notices: {{dmca_email}}<br />
  Privacy Inquiries: {{privacy_email}}<br />
  Abuse Reports: {{abuse_email}}<br />
</p>

<h2>23. Acknowledgment and Acceptance</h2>
<p>BY CREATING AN ACCOUNT, ACCESSING, OR USING {{site_name}}, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE AND ALL INCORPORATED POLICIES. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE PLATFORM.</p>
<p>You further acknowledge that:</p>
<ul>
  <li>You are at least 18 years of age</li>
  <li>You have the legal capacity to enter into these Terms</li>
  <li>You understand that the Platform contains adult content</li>
  <li>You will comply with all applicable laws and regulations</li>
  <li>You have read and understood the arbitration provision and class action waiver in Section 17</li>
</ul>

<p><strong>Last Updated:</strong> {{effective_date}}</p>
HTML,
                'description' => 'Terms of Service content (HTML allowed)',
                'type' => 'string',
                'category' => 'legal',
            ],

            // Verification
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
        ];

        foreach ($settings as $setting) {
            AdminSetting::query()->updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
