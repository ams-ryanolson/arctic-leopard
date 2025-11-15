<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        $setting = static::query()->where('key', $key)->first();

        if ($setting === null) {
            return $default;
        }

        return $setting->getValue();
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

        return $setting;
    }
}
