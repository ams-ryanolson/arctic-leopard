<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateCoordinatesRequest;
use Illuminate\Http\RedirectResponse;

class UpdateCoordinatesController extends Controller
{
    public function __invoke(UpdateCoordinatesRequest $request): RedirectResponse
    {
        $user = $request->user();

        $updateData = [
            'location_latitude' => $request->float('location_latitude'),
            'location_longitude' => $request->float('location_longitude'),
        ];

        // Optionally update city, region, country if provided
        if ($request->has('location_city')) {
            $updateData['location_city'] = $request->string('location_city')->toString();
        }
        if ($request->has('location_region')) {
            $updateData['location_region'] = $request->string('location_region')->toString();
        }
        if ($request->has('location_country')) {
            $updateData['location_country'] = $request->string('location_country')->toString();
        }

        $user->forceFill($updateData)->save();

        // If called from onboarding, redirect back to onboarding
        if ($request->header('Referer') && str_contains($request->header('Referer'), '/onboarding')) {
            return redirect()->back()->with('location.coordinates.updated', true);
        }

        return redirect()
            ->route('radar')
            ->with('location.coordinates.updated', true);
    }
}
