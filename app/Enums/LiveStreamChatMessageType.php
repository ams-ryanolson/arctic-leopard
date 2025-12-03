<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum LiveStreamChatMessageType: string
{
    use HasValues;

    case Text = 'text';
    case Tip = 'tip';
    case System = 'system';
}
