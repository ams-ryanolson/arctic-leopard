<?php

namespace Database\Seeders;

use App\Models\Hashtag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HashtagSeeder extends Seeder
{
    /**
     * Seed initial hashtags to help discovery.
     */
    public function run(): void
    {
        $hashtags = [
            'bdsm',
            'kinklife',
            'consentculture',
            'aftercare',
            'leather',
            'leatherdaddy',
            'leatherboy',
            'leatherfamily',
            'bootblack',
            'bootworship',
            'bondage',
            'shibari',
            'kinbaku',
            'ropebondage',
            'ropesuspension',
            'hogtie',
            'mummification',
            'latex',
            'rubber',
            'rubbersuit',
            'rubbermen',
            'gearplay',
            'gearworship',
            'fetishfashion',
            'pupplay',
            'puphood',
            'puppride',
            'handlerlife',
            'masterslave',
            'sirandslave',
            'dominant',
            'submissive',
            'switchlife',
            'bratlife',
            'discipline',
            'impactplay',
            'flogging',
            'paddles',
            'caneplay',
            'whipping',
            'strappado',
            'stressposition',
            'sensationplay',
            'waxplay',
            'fireplay',
            'iceplay',
            'breathplay',
            'electroplay',
            'violetwand',
            'tensplay',
            'nippleplay',
            'clampplay',
            'edging',
            'ruinedorgasm',
            'orgasmcontrol',
            'teaseanddenial',
            'chastity',
            'chastitylife',
            'keyholder',
            'cagedlife',
            'sounding',
            'soundplay',
            'prostateplay',
            'milkingmachine',
            'watersports',
            'fluidplay',
            'fisting',
            'glovefetish',
            'footworship',
            'pitworship',
            'muscleworship',
            'smokingfetish',
            'cigarfetish',
            'cigarplay',
            'leatherbar',
            'dungeonlife',
            'playparty',
            'scenelog',
            'fetishtravel',
            'ropephoria',
            'dungeonlog',
            'impactlegends',
            'waxalchemy',
        ];

        foreach ($hashtags as $tag) {
            $name = Str::of($tag)->replace('#', '')->lower()->toString();
            $slug = Str::slug($name);

            Hashtag::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                ]
            );
        }
    }
}


