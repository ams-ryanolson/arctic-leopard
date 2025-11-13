<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum EventType: string
{
    use HasValues;

    case Party = 'party';
    case Seminar = 'seminar';
    case Workshop = 'workshop';
    case Meetup = 'meetup';
    case Conference = 'conference';
    case Social = 'social';
    case Performance = 'performance';
    case Other = 'other';
}
