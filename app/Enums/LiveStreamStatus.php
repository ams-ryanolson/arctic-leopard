<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum LiveStreamStatus: string
{
    use HasValues;

    case Scheduled = 'scheduled';
    case Live = 'live';
    case Ended = 'ended';
}
