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

        $user->forceFill([
            'location_latitude' => $request->float('location_latitude'),
            'location_longitude' => $request->float('location_longitude'),
        ])->save();

        return redirect()
            ->route('radar')
            ->with('location.coordinates.updated', true);
    }
}
