<?php

namespace Database\Seeders;

use App\Models\Circle;
use App\Models\CircleFacet;
use App\Models\Interest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CircleSeeder extends Seeder
{
    /**
     * Seed the default circles and facet placeholders.
     */
    public function run(): void
    {
        $interests = Interest::query()
            ->orderBy('name')
            ->get();

        $sortOrder = 1;

        foreach ($interests as $interest) {
            /** @var \App\Models\Circle $circle */
            $circle = Circle::updateOrCreate(
                [
                    'interest_id' => $interest->getKey(),
                    'slug' => $interest->slug,
                ],
                [
                    'name' => $interest->name,
                    'tagline' => $this->resolveTagline($interest->description),
                    'description' => $interest->description,
                    'facet_filters' => null,
                    'metadata' => [
                        'interest_slug' => $interest->slug,
                    ],
                    'visibility' => 'public',
                    'is_featured' => $this->isFeaturedInterest($interest->name),
                    'sort_order' => $sortOrder,
                ]
            );

            CircleFacet::updateOrCreate(
                [
                    'circle_id' => $circle->getKey(),
                    'key' => 'segment',
                    'value' => 'general',
                ],
                [
                    'label' => 'General / All',
                    'description' => 'Main space for all members of the circle.',
                    'filters' => null,
                    'is_default' => true,
                    'sort_order' => 0,
                ]
            );

            $sortOrder++;
        }

        $this->seedSpecializedFacets();
    }

    /**
     * Provide a short tagline sourced from the interest description.
     */
    protected function resolveTagline(?string $description): ?string
    {
        if ($description === null) {
            return null;
        }

        $tagline = Str::of($description)->trim();

        if ($tagline->isEmpty()) {
            return null;
        }

        return Str::limit($tagline->toString(), 120);
    }

    /**
     * Identify a subset of interests we want to highlight by default.
     */
    protected function isFeaturedInterest(string $name): bool
    {
        $featured = [
            'Leather Brotherhood',
            'Rubber & Latex',
            'Pup Play & Handlers',
            'Financial Domination',
            'Fetish Fashion & Gear',
        ];

        return in_array($name, $featured, true);
    }

    /**
     * Seed extra facet stubs for circles that benefit from segmentation.
     */
    protected function seedSpecializedFacets(): void
    {
        $definitions = [
            'Financial Domination' => [
                [
                    'key' => 'segment',
                    'value' => 'male-dominant',
                    'label' => 'Male Dominant',
                    'description' => 'Male doms focusing on financial domination.',
                    'filters' => [
                        'gender' => ['man'],
                        'role_min' => 0,
                        'role_max' => 50,
                    ],
                    'sort_order' => 1,
                ],
                [
                    'key' => 'segment',
                    'value' => 'female-dominant',
                    'label' => 'Female Dominant',
                    'description' => 'Female doms focusing on financial domination.',
                    'filters' => [
                        'gender' => ['woman'],
                        'role_min' => 0,
                        'role_max' => 50,
                    ],
                    'sort_order' => 2,
                ],
                [
                    'key' => 'segment',
                    'value' => 'non-binary-dominant',
                    'label' => 'Non-binary Dominant',
                    'description' => 'Non-binary, genderfluid, agender, and other dominant identities focusing on financial domination.',
                    'filters' => [
                        'gender' => ['non-binary', 'genderfluid', 'agender', 'other'],
                        'role_min' => 0,
                        'role_max' => 50,
                    ],
                    'sort_order' => 3,
                ],
                [
                    'key' => 'segment',
                    'value' => 'submissive-support',
                    'label' => 'Submissive Support',
                    'description' => 'Financial submissives sharing accountability, budgets, and service ideas.',
                    'filters' => [
                        'role_min' => 50,
                        'role_max' => 100,
                    ],
                    'sort_order' => 4,
                ],
            ],
            'Chastity & Keyholding' => [
                [
                    'key' => 'segment',
                    'value' => 'wearer',
                    'label' => 'Wearer',
                    'description' => 'Chastity wearers sharing experiences, accountability, and support.',
                    'filters' => [
                        'role_min' => 50,
                        'role_max' => 100,
                    ],
                    'sort_order' => 1,
                ],
                [
                    'key' => 'segment',
                    'value' => 'keyholder',
                    'label' => 'Keyholder',
                    'description' => 'Keyholders coordinating schedules, rules, and protocols.',
                    'filters' => [
                        'role_min' => 0,
                        'role_max' => 50,
                    ],
                    'sort_order' => 2,
                ],
            ],
            'Pup Play & Handlers' => [
                [
                    'key' => 'segment',
                    'value' => 'pups',
                    'label' => 'Pups',
                    'description' => 'Training tips, gear fits, and howling good times for pups.',
                    'filters' => [
                        'role_min' => 50,
                        'role_max' => 100,
                    ],
                    'sort_order' => 1,
                ],
                [
                    'key' => 'segment',
                    'value' => 'handlers',
                    'label' => 'Handlers',
                    'description' => 'Advice and coordination for handlers running moshes and packs.',
                    'filters' => [
                        'role_min' => 0,
                        'role_max' => 50,
                    ],
                    'sort_order' => 2,
                ],
            ],
            'Muscle Worship' => [
                [
                    'key' => 'segment',
                    'value' => 'alphas',
                    'label' => 'Alphas',
                    'description' => 'Muscle alphas sharing workouts, nutrition, and dominance.',
                    'filters' => [
                        'role_min' => 0,
                        'role_max' => 50,
                    ],
                    'sort_order' => 1,
                ],
                [
                    'key' => 'segment',
                    'value' => 'betas',
                    'label' => 'Betas',
                    'description' => 'Betas celebrating muscle, service, and submission.',
                    'filters' => [
                        'role_min' => 50,
                        'role_max' => 100,
                    ],
                    'sort_order' => 2,
                ],
            ],
            'Bondage & Shibari' => [
                [
                    'key' => 'path',
                    'value' => 'rigger',
                    'label' => 'Rigging Lab',
                    'description' => 'Riggers swapping tie diagrams, safety drills, and scene design.',
                    'filters' => [
                        'role' => ['rigger'],
                    ],
                    'sort_order' => 1,
                ],
                [
                    'key' => 'path',
                    'value' => 'rope-bunny',
                    'label' => 'Rope Bunnies',
                    'description' => 'Bottoms sharing experiences, body care, and communication tips.',
                    'filters' => [
                        'role' => ['bottom'],
                    ],
                    'sort_order' => 2,
                ],
            ],
        ];

        foreach ($definitions as $interestName => $facets) {
            $circle = Circle::query()
                ->whereHas('interest', fn ($query) => $query->where('name', $interestName))
                ->first();

            if (! $circle) {
                continue;
            }

            $facetFilters = $circle->facet_filters ?? [];
            $facetFilters['available_keys'] = array_values(array_unique(array_merge(
                $facetFilters['available_keys'] ?? [],
                collect($facets)->pluck('key')->all()
            )));

            $circle->update([
                'facet_filters' => $facetFilters,
            ]);

            foreach ($facets as $definition) {
                CircleFacet::updateOrCreate(
                    [
                        'circle_id' => $circle->getKey(),
                        'key' => $definition['key'],
                        'value' => $definition['value'],
                    ],
                    [
                        'label' => $definition['label'],
                        'description' => $definition['description'],
                        'filters' => $definition['filters'],
                        'is_default' => false,
                        'sort_order' => $definition['sort_order'],
                    ]
                );
            }
        }
    }
}
