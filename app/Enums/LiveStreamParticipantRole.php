<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum LiveStreamParticipantRole: string
{
    use HasValues;

    case Host = 'host';
    case CoHost = 'co_host';
    case Guest = 'guest';
    case Viewer = 'viewer';
}
