<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AdminSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'description',
        'type',
        'category',
    ];

    protected static function booted(): void
    {
        static::saved(function (self $setting): void {
            Cache::forget(static::cacheKey($setting->key));
        });

        static::deleted(function (self $setting): void {
            Cache::forget(static::cacheKey($setting->key));
        });
    }

    protected static function cacheKey(string $key): string
    {
        return "admin_setting:{$key}";
    }

    public function getValue(): mixed
    {
        return match ($this->type) {
            'integer' => (int) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    public function setValue(mixed $value): void
    {
        $this->value = match ($this->type) {
            'integer' => (string) $value,
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => (string) $value,
        };
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever(static::cacheKey($key), function () use ($key, $default) {
            $setting = static::query()->where('key', $key)->first();

            return $setting?->getValue() ?? $default;
        });
    }

    public static function set(string $key, mixed $value): static
    {
        $setting = static::query()->firstOrNew(['key' => $key]);

        if (! $setting->exists) {
            $setting->type = 'string';
            $setting->category = 'general';
        }

        $setting->setValue($value);
        $setting->save();

        Cache::forget(static::cacheKey($key));

        return $setting;
    }
}
