<?php

namespace Database\Seeders;

use App\Models\Interest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InterestSeeder extends Seeder
{
    /**
     * Seed the interests table with a curated set of options.
     */
    public function run(): void
    {
        $interests = [
            [
                'name' => 'Leather Brotherhood',
                'description' => 'Classic leather traditions, mentoring, and gear nights.',
            ],
            [
                'name' => 'Rubber & Latex',
                'description' => 'Shiny suits, breathy rubber scenes, and slick play.',
            ],
            [
                'name' => 'Pup Play & Handlers',
                'description' => 'Pups, handlers, mosh pits, and pet dynamic training.',
            ],
            [
                'name' => 'Master / Slave Dynamics',
                'description' => 'Structured power exchange with contracts and protocol.',
            ],
            [
                'name' => 'Daddies & Boys',
                'description' => 'Age-dynamic nurturing, mentorship, and discipline.',
            ],
            [
                'name' => 'Bears & Otters',
                'description' => 'Body-positive kink with furry, stocky energy.',
            ],
            [
                'name' => 'Muscle Worship',
                'description' => 'Admiring, servicing, and showing off muscular physiques.',
            ],
            [
                'name' => 'Bondage & Shibari',
                'description' => 'Rope artistry, harness work, and intricate ties.',
            ],
            [
                'name' => 'Suspension & Mummification',
                'description' => 'Full immobilization through flight rigs and body wraps.',
            ],
            [
                'name' => 'Impact & Flogging',
                'description' => 'Paddles, floggers, crops, and rhythm sessions.',
            ],
            [
                'name' => 'Electro & Violet Wand',
                'description' => 'Tingly electro play with violet wands and e-stim toys.',
            ],
            [
                'name' => 'Sensation & Temperature Play',
                'description' => 'Mixing textures, ice, heat, and contrast sensations.',
            ],
            [
                'name' => 'Chastity & Keyholding',
                'description' => 'Caging, tease-and-denial, and devoted keyholding.',
            ],
            [
                'name' => 'Orgasm Control',
                'description' => 'Edging, ruined releases, and orgasm obedience training.',
            ],
            [
                'name' => 'Foot & Boot Worship',
                'description' => 'Bootblacking rituals, foot fetish service, and polish.',
            ],
            [
                'name' => 'Smoke & Cigar Fetish',
                'description' => 'Cigar lounges, smoky power scenes, and ash service.',
            ],
            [
                'name' => 'Fisting & Depth Play',
                'description' => 'Gloved fists, depth exploration, and stretch goals.',
            ],
            [
                'name' => 'Medical & Clinical Scenes',
                'description' => 'Clinic roleplay with precise exams and instruments.',
            ],
            [
                'name' => 'Breath & Edge Play',
                'description' => 'Masks, bag play, and carefully managed limits.',
            ],
            [
                'name' => 'Public & Exhibitionist Play',
                'description' => 'Voyeur nights, cruising spots, and risk-aware exposure.',
            ],
            [
                'name' => 'Dungeon Masters & Rigging',
                'description' => 'Running scenes, rigging builds, and safety leadership.',
            ],
            [
                'name' => 'Fetish Fashion & Gear',
                'description' => 'Harnesses, hoods, chaps, and statement gear looks.',
            ],
            [
                'name' => 'Financial Domination',
                'description' => 'Tributes, allowance control, and wallet worship.',
            ],
            [
                'name' => 'Skinhead Brotherhood',
                'description' => 'Boots, braces, and hard-edged skinhead attitude.',
            ],
            [
                'name' => 'Scally & Sportswear Fetish',
                'description' => 'Trackies, hoodies, and bad-boy street energy.',
            ],
            [
                'name' => 'Uniform & Military Fetish',
                'description' => 'Officers, cadets, inspections, and parade-ground roleplay.',
            ],
            [
                'name' => 'Sneaker & Trainer Worship',
                'description' => 'Sniffing sneakers, sweaty socks, and trainer service.',
            ],
            [
                'name' => 'Humiliation & Service Submission',
                'description' => 'Verbal degradation, chores, and protocol humbling.',
            ],
            [
                'name' => 'Motorcycle & Biker Brotherhood',
                'description' => 'Club rides, biker bars, and road-worn leather.',
            ],
            [
                'name' => 'Primal Wrestling & Roughhousing',
                'description' => 'Grappling, sweaty dominance, and animal drive.',
            ],
        ];

        $allowedSlugs = collect($interests)
            ->map(fn (array $interest): string => Str::slug($interest['name']))
            ->all();

        Interest::query()
            ->whereNotIn('slug', $allowedSlugs)
            ->delete();

        foreach ($interests as $interest) {
            $slug = Str::slug($interest['name']);

            Interest::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $interest['name'],
                    'description' => $interest['description'],
                ]
            );
        }
    }
}
