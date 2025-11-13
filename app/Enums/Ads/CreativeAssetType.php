<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum CreativeAssetType: string
{
    use HasValues;

    case Image = 'image';
    case Video = 'video';
    case Html = 'html';
}
