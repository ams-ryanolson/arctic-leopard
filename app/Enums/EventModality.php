<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum EventModality: string
{
    use HasValues;

    case InPerson = 'in_person';
    case Virtual = 'virtual';
    case Hybrid = 'hybrid';
}
