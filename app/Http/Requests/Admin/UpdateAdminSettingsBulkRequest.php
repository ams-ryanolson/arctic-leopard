<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminSettingsBulkRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('manageUsers', User::class) || $user->can('manage settings');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'settings' => ['required', 'array'],
        ];

        $settings = (array) $this->input('settings', []);

        // Feature flags: must be boolean
        foreach ($settings as $key => $_value) {
            if (is_string($key) && str_starts_with($key, 'feature_')) {
                $rules["settings.{$key}"] = ['required', 'boolean'];
            }
        }

        // Verification settings
        $rules['settings.id_verification_expires_after_years'] = ['nullable', 'integer', 'in:1,2'];
        $rules['settings.id_verification_grace_period_days'] = ['nullable', 'integer', 'min:1'];
        $rules['settings.id_verification_provider'] = ['nullable', 'string'];

        // Communication & Support: emails / url / strings
        $rules['settings.support_email'] = ['nullable', 'email'];
        $rules['settings.legal_email'] = ['nullable', 'email'];
        $rules['settings.press_email'] = ['nullable', 'email'];
        $rules['settings.abuse_email'] = ['nullable', 'email'];
        $rules['settings.outbound_from_name'] = ['nullable', 'string', 'max:255'];
        $rules['settings.outbound_from_email'] = ['nullable', 'email'];
        $rules['settings.contact_url'] = ['nullable', 'url'];
        // Legal
        $rules['settings.cookie_policy_content'] = ['nullable', 'string'];
        $rules['settings.dmca_policy_content'] = ['nullable', 'string'];
        $rules['settings.age_of_consent_text'] = ['nullable', 'string'];
        $rules['settings.terms_content'] = ['nullable', 'string'];
        $rules['settings.privacy_content'] = ['nullable', 'string'];
        $rules['settings.guidelines_content'] = ['nullable', 'string'];
        // Cookies & GDPR
        $rules['settings.cookie_banner_enabled'] = ['nullable', 'boolean'];
        $rules['settings.cookie_banner_message'] = ['nullable', 'string'];
        $rules['settings.cookie_banner_cta_label'] = ['nullable', 'string', 'max:100'];
        $rules['settings.cookie_banner_policy_url'] = ['nullable', 'url'];
        $rules['settings.cookie_allow_analytics'] = ['nullable', 'boolean'];
        $rules['settings.cookie_allow_marketing'] = ['nullable', 'boolean'];
        $rules['settings.cookies_services'] = ['nullable']; // stored as JSON string; admin UI ensures shape
        $rules['settings.do_not_sell_default'] = ['nullable', 'boolean'];
        $rules['settings.consent_reprompt_days'] = ['nullable', 'integer', 'min:1', 'max:730'];

        // Announcements & Maintenance
        $rules['settings.global_announcement_enabled'] = ['nullable', 'boolean'];
        $rules['settings.global_announcement_level'] = ['nullable', 'in:info,warn,urgent'];
        $rules['settings.global_announcement_message'] = ['nullable', 'string'];
        $rules['settings.global_announcement_dismissible'] = ['nullable', 'boolean'];
        $rules['settings.global_announcement_start_at'] = ['nullable', 'date'];
        $rules['settings.global_announcement_end_at'] = ['nullable', 'date'];
        $rules['settings.maintenance_banner_enabled'] = ['nullable', 'boolean'];
        $rules['settings.maintenance_banner_message'] = ['nullable', 'string'];
        $rules['settings.maintenance_banner_cta_label'] = ['nullable', 'string', 'max:50'];
        $rules['settings.maintenance_banner_cta_url'] = ['nullable', 'url'];
        $rules['settings.emergency_interstitial_enabled'] = ['nullable', 'boolean'];
        $rules['settings.emergency_interstitial_message'] = ['nullable', 'string'];

        // Allow any additional settings (for flexibility)
        // These will be validated based on their value type
        foreach ($settings as $key => $value) {
            if (is_string($key) && ! isset($rules["settings.{$key}"])) {
                // Infer type from value
                if (is_bool($value)) {
                    $rules["settings.{$key}"] = ['nullable', 'boolean'];
                } elseif (is_int($value)) {
                    $rules["settings.{$key}"] = ['nullable', 'integer'];
                } else {
                    $rules["settings.{$key}"] = ['nullable', 'string'];
                }
            }
        }

        return $rules;
    }
}
