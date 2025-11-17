<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

trait GeneratesUuid
{
    /**
     * Boot the GeneratesUuid trait.
     */
    public static function bootGeneratesUuid(): void
    {
        static::creating(function (Model $model): void {
            $column = $model->getUuidColumn();

            if (! $model->getAttribute($column)) {
                $model->setAttribute($column, (string) Str::uuid());
            }
        });
    }

    /**
     * Get the column name used to store the UUID.
     */
    protected function getUuidColumn(): string
    {
        return property_exists($this, 'uuidColumn')
            ? $this->uuidColumn
            : 'uuid';
    }
}
